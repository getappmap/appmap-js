import yargs from 'yargs';
import lazyHandler from '../lib/lazyHandler';

export const command = 'apply [filename]';
export const describe =
  'Apply file changes using search and replace strings or an XML changeset file';

export function builder<T>(args: yargs.Argv<T>) {
  return args
    .positional('filename', {
      describe: 'File to apply changes to. If it does not exist, it will be created.',
      type: 'string',
    })
    .option('directory', {
      describe: 'program working directory',
      type: 'string',
      alias: 'd',
    })
    .option('search', {
      describe:
        'File containing the search string. Required unless the target file does not exist.',
      type: 'string',
      alias: 's',
    })
    .option('replace', {
      describe: 'File containing the replace string.',
      type: 'string',
      alias: 'r',
    })
    .option('xml', {
      describe: 'XML file containing the changeset.',
      type: 'string',
      alias: 'x',
    });
}

export type HandlerArguments = yargs.ArgumentsCamelCase<
  ReturnType<typeof builder> extends yargs.Argv<infer A> ? A : never
>;

export const handler = lazyHandler(() => import('./applyHandler'));
