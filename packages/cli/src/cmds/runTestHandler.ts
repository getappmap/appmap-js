import type { HandlerArguments } from './runTest';
import { configureRpcDirectories, handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { TestInvocation } from '@appland/navie';
import { randomUUID } from 'crypto';
import invokeTests, { InvocationStrategy } from './navie/invokeTests';
import { resolve } from 'path';

export default async function handler(argv: HandlerArguments) {
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

  const invocationResult = await invokeTests(InvocationStrategy.SHELL, invocationRequest);
  console.log('Invocation result:', JSON.stringify(invocationResult, null, 2));
}
