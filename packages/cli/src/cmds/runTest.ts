import yargs from 'yargs';
import lazyHandler from '../lib/lazyHandler';

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
      describe: 'invocation option (sync or async)',
      type: 'string',
      choices: ['sync', 'async'],
      default: 'sync',
    });
}

export type HandlerArguments = yargs.ArgumentsCamelCase<
  ReturnType<typeof builder> extends yargs.Argv<infer A> ? A : never
>;

export const handler = lazyHandler(() => import('./runTestHandler'));
