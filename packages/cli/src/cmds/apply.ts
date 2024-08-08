import yargs from 'yargs';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { exists } from '../utils';
import { mkdir, readFile, writeFile } from 'fs/promises';
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
      describe:
        'File containing the search string. Required unless the target file does not exist.',
      type: 'string',
      alias: 's',
    })
    .option('replace', {
      describe: 'File containing the replace string.',
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

  const { filename, search: searchFile, replace: replaceFile } = argv;

  if (!(await exists(replaceFile)))
    throw new Error(`-r/--replace file ${replaceFile} does not exist`);

  const replaceText = await readFile(replaceFile, 'utf-8');

  const filedir = dirname(filename);
  await mkdir(filedir, { recursive: true });
  if (!(await exists(filename))) {
    await writeFile(filename, replaceText, 'utf-8');
  } else {
    if (!searchFile) throw new Error('-s/--search argument is required for existing files');

    if (!(await exists(searchFile)))
      throw new Error(`-s/--search file ${searchFile} does not exist`);

    const searchText = await readFile(searchFile, 'utf-8');

    await applyFileUpdate(filename, searchText, replaceText);
  }
}
