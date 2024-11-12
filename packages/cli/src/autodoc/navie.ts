import * as child_process from 'child_process';
import { join } from 'path';
import { verbose } from '../utils';
import { tmpdir } from 'os';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { warn } from 'console';

export type NavieOptions = {
  codeSelection?: string;
  prompt?: string;
};

export async function navie(
  directory: string,
  question: string,
  options = {} as NavieOptions
): Promise<string> {
  // Invoke the navie command line program with the provided arguments

  const cliCommandName = process.argv[0];
  let launchArgs: string[];
  if (cliCommandName.endsWith('appmap')) {
    launchArgs = [];
  } else {
    const programName = process.argv[1];
    launchArgs = [programName];
  }

  const questionId = Math.random().toString(36).substring(7);
  const dirName = join(tmpdir(), questionId);
  mkdirSync(dirName, { recursive: true });
  process.on('exit', () => {
    try {
      rmSync(dirName, { recursive: true });
    } catch (error) {
      console.error(`Failed to remove directory ${dirName}:`, error);
    }
  });

  const storeContentInTempFile = (name: string, content: string): string => {
    const tempFile = join(dirName, name);
    writeFileSync(tempFile, content);
    return tempFile;
  };

  const args = [...launchArgs, 'navie', '--directory', directory].flat();
  if (options.codeSelection)
    args.push(
      '--code-selection',
      storeContentInTempFile('codeSelection.txt', options.codeSelection)
    );
  if (options.prompt) args.push('--prompt', storeContentInTempFile('prompt.md', options.prompt));
  if (verbose()) {
    args.push('--verbose');
    args.push('--log-navie');
  }
  args.push(question);

  warn(args.join(' '));

  const processResult = child_process.spawn(cliCommandName, args);
  let output = '';
  const readProcessOutput = new Promise<string>((resolve, reject) => {
    processResult.stdout.on('data', (data: Buffer) => {
      output += data.toString('utf-8');
    });
    processResult.stderr.on('data', (data: Buffer) => {
      if (verbose()) console.warn(data.toString('utf8'));
    });
    processResult.on('close', (code: number) => {
      if (code !== 0) {
        reject(new Error(`navie exited with code ${code}`));
      }
      resolve(output);
    });
  });

  await readProcessOutput;

  console.log(output);

  return output;
}
