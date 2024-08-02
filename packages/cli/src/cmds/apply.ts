import yargs from 'yargs';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { exists } from '../utils';
import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';
import applyFileUpdate from '../rpc/file/applyFileUpdate';

export const command = 'apply <filename>';
export const describe = 'Apply file changes using search and replace strings';

export function builder<T>(args: yargs.Argv<T>) {
  return args
    .positional('filename', {
      describe: 'File to apply changes to. If it does not exist, it will be created.',
      type: 'string',
      demandOption: true,
    })
    .option('directory', {
      describe: 'program working directory',
      type: 'string',
      alias: 'd',
    })
    .option('search', {
      describe: 'Search string. Required unless the file does not exist.',
      type: 'string',
      alias: 's',
    })
    .option('replace', {
      describe: 'Replace string.',
      type: 'string',
      alias: 'r',
      demandOption: true,
    });
}

type HandlerArguments = yargs.ArgumentsCamelCase<
  ReturnType<typeof builder> extends yargs.Argv<infer A> ? A : never
>;

export async function handler(argv: HandlerArguments) {
  handleWorkingDirectory(argv.directory);

  const { filename, search, replace } = argv;

  const filedir = dirname(filename);
  await mkdir(filedir, { recursive: true });
  if (!(await exists(filename))) {
    await writeFile(filename, replace, 'utf-8');
  } else {
    if (!search) {
      throw new Error('Search string is required for existing files');
    }

    await applyFileUpdate(filename, search, replace);
  }
}
