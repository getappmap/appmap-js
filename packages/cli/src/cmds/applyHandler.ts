import type { HandlerArguments } from './apply';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { exists } from '../utils';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname } from 'path';
import applyFileUpdate from '../rpc/file/applyFileUpdate';
import { extractFileChanges } from '@appland/navie';
import { readFileSync } from 'fs';

export default async function handler(argv: HandlerArguments) {
  handleWorkingDirectory(argv.directory);

  const { filename, search: searchFile, replace: replaceFile, xml: xmlFile } = argv;

  if (filename && replaceFile) {
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
  } else if (!process.stdin.isTTY || xmlFile) {
    let changesFile: string | number | undefined = xmlFile;
    if (!changesFile) {
      console.warn('No changes file specified, reading from stdin');
      changesFile = 0;
      process.stdin.resume();
    }

    const changes = extractFileChanges(readFileSync(changesFile, 'utf-8'));
    for (const { file, original, modified } of changes) {
      try {
        if (!file) {
          console.warn('Skipping change without file name');
          continue;
        }
        const result = await applyFileUpdate(file, original, modified);
        if (result) console.log(result.join(''));
        // TODO better error and success reporting
        else console.log(`Applied: ${file}`);
      } catch (e) {
        console.error(`Error applying ${file}: ${String(e)}`);
      }
    }
  } else {
    throw new Error('Either -s/--search and -r/--replace or -x/--xml must be provided');
  }
}
