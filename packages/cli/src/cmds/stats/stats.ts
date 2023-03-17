import { chdir } from 'process';
import { existsSync, lstatSync } from 'fs';
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

  let globString = path.join(appmapDir, '**', userInput + extension);
  if (path.isAbsolute(userInput + extension)) {
    globString = userInput + extension;
  }

  const matches = glob.sync(globString);

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
    describe: 'Working directory for the command',
    type: 'string',
    alias: 'd',
    default: '.',
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

  args.option('appmap-dir', {
    describe: 'Directory to recursively inspect for AppMaps',
    type: 'string',
  });

  return args.strict();
};

export async function handler(
  argv: any,
  handlerCaller: string = 'from_stats'
): Promise<Array<EventInfo> | Promise<[SortedAppMapSize[], SlowestExecutionTime[]]> | undefined> {
  const { directory, format, limit, appmapFile } = argv;
  const isVerbose = argv.verbose;
  let appmapDir: string;

  if (!existsSync(directory) || !lstatSync(directory).isDirectory())
    throw Error('Invalid directory');
  if (isVerbose) console.log(`Using working directory: ${directory}`);
  chdir(directory);

  try {
    appmapDir = await locateAppMapDir(argv.appmapDir);
    if (isVerbose) console.log(`Using appmap-dir: ${path.join(__dirname, appmapDir)}`);
  } catch (e) {
    console.warn(
      chalk.yellow('No appmap-dir found, defaulting to the current working directory.\n')
    );
    appmapDir = directory;
  }

  if (appmapFile) {
    const fileToAnalyze = await locateAppMapFile(appmapFile, appmapDir);
    if (!fileToAnalyze) return;
    if (isVerbose) console.log('Analyzing map: ', path.join(__dirname, fileToAnalyze));
    return await statsForMap(format, limit, fileToAnalyze);
  }

  return await statsForDirectory(isVerbose, appmapDir, format, limit, handlerCaller);
}

export default {
  command: command,
  describe: describe,
  builder: builder,
  handler: handler,
};
