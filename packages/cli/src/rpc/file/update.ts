import { ExplainRpc, FileRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { exists } from '../../utils';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { warn } from 'console';
import { INavieProvider } from '../explain/navie/inavie';
import { explain, explainStatus } from '../explain/explain';
import applyFileUpdate from './applyFileUpdate';
import { dirname } from 'path';

function reportError(operation: string, e: Error | unknown, file: string) {
  const tokens = [`[file-update] Failed to ${operation} ${file}`];
  if (e instanceof Error) tokens.push(e.message);
  warn(tokens.join(': '));
}

async function createFile(file: string, modified: string): Promise<FileRpc.UpdateResponse> {
  try {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, modified, 'utf-8');

    return {
      exists: true,
      succeeded: true,
      modified,
    };
  } catch (e) {
    reportError('write file', e, file);

    return {
      exists: true,
      succeeded: false,
    };
  }
}

interface UpdateTemplate {
  original: string;
  modified: string;
}

async function createTemplate(
  navieProvider: INavieProvider,
  file: string,
  modified: string
): Promise<UpdateTemplate> {
  // Read the original file
  const original = await readFile(file, 'utf-8');

  const explainResponse = await explain(
    navieProvider,
    ['@update', modified].join('\n'),
    original,
    [],
    undefined,
    undefined,
    undefined
  );

  let status: ExplainRpc.ExplainStatusResponse | undefined;

  const awaitCompletion = async (interval: number, timeout: number) => {
    const finalSteps = [ExplainRpc.Step.COMPLETE, ExplainRpc.Step.ERROR];
    const complete = () => status && finalSteps.includes(status.step);

    let remaining = timeout;
    while (!complete()) {
      await new Promise((resolve) => setTimeout(resolve, interval));

      status = explainStatus(explainResponse.userMessageId);
      remaining = remaining - interval;
      if (remaining <= 0) {
        warn(`[file-update] Timed out waiting for @update operation of ${file}`);
        break;
      }
    }
  };

  await awaitCompletion(2, 30000);

  if (status?.step !== ExplainRpc.Step.COMPLETE) throw new Error(`completion failed`);

  return JSON.parse((status.explanation || []).join('')) as {
    original: string;
    modified: string;
  };
}

async function updateFile(
  navieProvider: INavieProvider,
  file: string,
  modified: string,
  original: string
): Promise<FileRpc.UpdateResponse> {
  try {
    await applyFileUpdate(file, original, modified);
  } catch (e) {
    reportError('update file', e, file);

    return {
      exists: true,
      succeeded: false,
      original,
      modified,
    };
  }

  return {
    exists: true,
    succeeded: true,
    original,
    modified,
  };
}

export async function handler(
  navieProvider: INavieProvider,
  file: string,
  target: string,
  original?: string
): Promise<FileRpc.UpdateResponse> {
  const fileExists = async () => exists(file);

  if (!(await fileExists())) {
    return createFile(file, target);
  } else {
    if (original) return updateFile(navieProvider, file, target, original);
    try {
      const { modified, original } = await createTemplate(navieProvider, file, target);
      return updateFile(navieProvider, file, modified, original);
    } catch (e) {
      reportError('create template', e, file);

      return {
        exists: true,
        succeeded: false,
      };
    }
  }
}

export function update(
  navieProvider: INavieProvider
): RpcHandler<FileRpc.UpdateOptions, FileRpc.UpdateResponse> {
  return {
    name: FileRpc.UpdateFunctionName,
    handler: (args) => handler(navieProvider, args.file, args.modified, args.original),
  };
}
