import { log, warn } from 'node:console';
import yargs from 'yargs';
import { configureRpcDirectories } from '../lib/handleWorkingDirectory';
import detectCodeEditor from '../lib/detectCodeEditor';
import { buildNavieProvider, commonNavieArgsBuilder } from './navie';
import INavie, { INavieProvider } from '../rpc/explain/navie/inavie';
import { rpcMethods } from './index/rpc';
import { readFile } from 'node:fs/promises';

export const command = 'rpc-client <function> [request]';
export const describe = 'Invoke an RPC function without running the server';

export function builder<T>(args: yargs.Argv<T>) {
  return commonNavieArgsBuilder(args)
    .positional('function', {
      describe: 'RPC function name',
      type: 'string',
    })
    .positional('request', {
      describe: 'RPC request argument as JSON',
      type: 'string',
    })
    .option('input', {
      alias: 'i',
      describe: 'Input file',
      type: 'string',
    });
}

type HandlerArguments = yargs.ArgumentsCamelCase<
  ReturnType<typeof builder> extends yargs.Argv<infer A> ? A : never
>;

export async function handler(argv: HandlerArguments) {
  await configureRpcDirectories(argv.directory);

  let requestStr: string | undefined;
  if (argv.input) {
    requestStr = await readFile(argv.input, 'utf8');
  } else {
    requestStr = argv.request;
  }
  if (!requestStr) throw new Error('Either --input or <request> must be provided');

  const requestData = JSON.parse(requestStr as unknown as string);

  if (argv.directory.length === 1) process.chdir(argv.directory[0]);
  else if (argv.directory.length > 1)
    warn(`There are multiple directories, so ensure that any file paths are absolute.`);

  function attachNavie(navie: INavie) {
    return navie.on('error', (err) => {
      warn(err);
      process.exitCode = 1;
    });
  }

  let codeEditor: string | undefined = argv.codeEditor;
  if (!codeEditor) {
    codeEditor = detectCodeEditor();
    if (codeEditor) warn(`Detected code editor: ${codeEditor}`);
  }

  if (argv.directory.length === 1) process.chdir(argv.directory[0]);
  else if (argv.directory.length > 1)
    warn(`There are multiple directories, so ensure that any file paths are absolute.`);

  const capturingProvider = (...args: Parameters<INavieProvider>) =>
    attachNavie(buildNavieProvider(argv)(...args));

  const methods = rpcMethods(capturingProvider, codeEditor);
  const method = methods.find((m) => m.name === argv.function);
  if (!method) throw new Error(`No such method: ${argv.function}`);

  const response = await method.handler(requestData);
  log(JSON.stringify(response, null, 2));

  return response;
}
