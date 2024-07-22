import { ExplainRpc, FileRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { exists } from '../../utils';
import { readFile, writeFile } from 'fs/promises';
import { warn } from 'console';
import { INavieProvider } from '../explain/navie/inavie';
import { explain, explainStatus } from '../explain/explain';
import applyFileUpdate from './applyFileUpdate';

function reportError(operation: string, e: Error | unknown, file: string) {
  const tokens = [`[file-update] Failed to ${operation} ${file}`];
  if (e instanceof Error) tokens.push(e.message);
  warn(tokens.join(': '));
}

async function createFile(file: string, modified: string): Promise<FileRpc.UpdateResponse> {
  try {
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

async function updateFile(
  navieProvider: INavieProvider,
  file: string,
  modified: string
): Promise<FileRpc.UpdateResponse> {
  // Read the original file
  let original: string | undefined;
  try {
    original = await readFile(file, 'utf-8');
  } catch (e) {
    reportError('read file', e, file);

    return {
      exists: true,
      succeeded: false,
    };
  }

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

  if (status?.step !== ExplainRpc.Step.COMPLETE) {
    warn(`[file-update] Failed to update ${file}`);
    return {
      exists: true,
      succeeded: false,
    };
  }

  const result = JSON.parse((status.explanation || []).join('')) as {
    original: string;
    modified: string;
  };

  try {
    await applyFileUpdate(file, result.original, result.modified);
  } catch (e) {
    reportError('update file', e, file);

    return {
      exists: true,
      succeeded: false,
      original: result.original,
      modified: result.modified,
    };
  }

  return {
    exists: true,
    succeeded: true,
    original: result.original,
    modified: result.modified,
  };
}

export async function handler(
  navieProvider: INavieProvider,
  file: string,
  modified: string
): Promise<FileRpc.UpdateResponse> {
  const fileExists = async () => exists(file);

  if (!(await fileExists())) {
    return createFile(file, modified);
  } else {
    return updateFile(navieProvider, file, modified);
  }
}

export function update(
  navieProvider: INavieProvider
): RpcHandler<FileRpc.UpdateOptions, FileRpc.UpdateResponse> {
  return {
    name: FileRpc.UpdateFunctionName,
    handler: (args) => handler(navieProvider, args.file, args.modified),
  };
}
