import yargs from 'yargs';
import { configureRpcDirectories, handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { TestInvocation } from '@appland/navie';
import { randomUUID } from 'crypto';
import invokeTests from './navie/invokeTests';
import { resolve } from 'path';

export const command = 'run-test <filename...>';
export const describe =
  'Runs a test according to the configuration available in the environment and .appmaprc.yml';

export function builder<T>(args: yargs.Argv<T>) {
  return args
    .positional('filename', {
      describe: 'File to apply changes to. If it does not exist, it will be created.',
      type: 'string',
      array: true,
    })
    .option('directory', {
      describe: 'program working directory',
      type: 'string',
      alias: 'd',
    })
    .option('invocation', {
      describe: 'invocation option (async or immediate)',
      type: 'string',
      choices: ['async', 'immediate'],
    });
}

type HandlerArguments = yargs.ArgumentsCamelCase<
  ReturnType<typeof builder> extends yargs.Argv<infer A> ? A : never
>;

export async function handler(argv: HandlerArguments) {
  const workingDirectory = resolve(process.cwd(), argv.directory ?? process.cwd());
  handleWorkingDirectory(argv.directory);

  await configureRpcDirectories([workingDirectory]);

  const { filename: filenames, invocation: invocationArg } = argv;

  if (!filenames || filenames.length === 0) throw new Error('No filename provided');

  const invocation = invocationArg ?? 'async';
  if (invocation !== 'sync' && invocation !== 'async')
    throw new Error(`Invalid invocation type: ${invocation}. Must be 'sync' or 'async'`);

  const testItems: TestInvocation.TestInvocationItem[] = filenames.map((filename) => ({
    id: randomUUID(),
    filePath: filename,
    testName: filename,
  }));

  const invocationRequest: TestInvocation.TestInvocationRequest = {
    invocation: invocation,
    testItems,
  };

  const invocationResult = await invokeTests(invocationRequest);
  console.log('Invocation result:', JSON.stringify(invocationResult, null, 2));
}
