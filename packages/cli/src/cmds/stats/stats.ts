import { existsSync } from 'fs';
import path from 'path';
import glob from 'glob';
import chalk from 'chalk';
import yargs from 'yargs';
import { statsForDirectory } from './directory/statsForDirectory';
import { EventInfo, statsForMap } from './directory/statsForMap';
import { SortedAppMapSize } from './types/appMapSize';
import { SlowestExecutionTime } from './types/functionExecutionTime';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import UI from '../userInteraction';
import { verbose } from '../../utils';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';

export const command = 'stats [directory]';
export const describe =
  'Show statistics about events from an AppMap or from all AppMaps in a directory';
const LIMIT_DEFAULT = 10;

async function locateAppMapFile(userInput: string, appmapDir: string): Promise<string | undefined> {
  let extension = '.appmap.json';
  if (userInput.endsWith('.appmap.json')) {
    extension = '';
  } else if (userInput.endsWith('.appmap')) {
    extension = '.json';
  }
  const mapFile = userInput + extension;

  const appmapDirIsCwd = (): boolean => path.resolve(appmapDir) === process.cwd();

  // if --appmap-file is a valid exact path, then return it
  if (path.isAbsolute(mapFile) && existsSync(mapFile)) return mapFile;

  // resolve --appmap-dir and --appmap-file and check for an exact match
  const searchPath = appmapDirIsCwd() ? mapFile : path.join(appmapDir, mapFile);
  if (existsSync(path.resolve(searchPath))) return searchPath;

  // recursively search in the --appmap-dir
  const globArray = appmapDirIsCwd() ? ['**', mapFile] : [appmapDir, '**', mapFile];
  const matches = glob.sync(path.join(...globArray));

  if (matches.length === 0) {
    console.error(chalk.red('No matching AppMap found'));
    return;
  } else if (matches.length > 1) {
    const { choice } = await UI.prompt({
      type: 'list',
      choices: matches,
      name: 'choice',
      message: 'There are multiple matching AppMaps, which one do you want to anlyze?',
    });
    return choice;
  }
  return matches[0];
}

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });

  args.option('format', {
    describe: 'How to format the output',
    choices: ['json', 'text'],
    alias: 'f',
    default: 'text',
  });

  args.option('limit', {
    describe: 'Number of methods to display',
    type: 'number',
    alias: 'l',
    default: LIMIT_DEFAULT,
  });

  args.option('appmap-file', {
    describe: 'AppMap to analyze',
    type: 'string',
    alias: 'a',
  });

  return args.strict();
};

export async function handler(
  argv: any,
  handlerCaller: string = 'from_stats'
): Promise<Array<EventInfo> | Promise<[SortedAppMapSize[], SlowestExecutionTime[]]> | undefined> {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);

  let appmapDir: string;
  try {
    appmapDir = await locateAppMapDir(argv.appmapDir);
  } catch (e) {
    appmapDir = process.cwd();
  }

  const { format, limit, appmapFile } = argv;

  if (appmapFile) {
    const fileToAnalyze = await locateAppMapFile(appmapFile, appmapDir);
    if (!fileToAnalyze) return;

    console.warn(chalk.yellow(`Analyzing AppMap: ${fileToAnalyze}\n`));
    return await statsForMap(format, limit, fileToAnalyze);
  }

  return await statsForDirectory(appmapDir, format, limit, handlerCaller);
}

export default {
  command: command,
  describe: describe,
  builder: builder,
  handler: handler,
};
