import { existsSync } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { statsForDirectory } from './statsForDirectory';
import { statsForMap } from './statsForMap';
import { SortedAppMapSize } from './types/appMapSize';
import { SlowestExecutionTime } from './types/functionExecutionTime';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { verbose } from '../../utils';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { EventInfo } from './accumulateEvents';

async function locateAppMapFile(userInput: string, appmapDir: string): Promise<string | undefined> {
  let extension = '.appmap.json';
  if (userInput.endsWith('.appmap.json')) {
    extension = '';
  } else if (userInput.endsWith('.appmap')) {
    extension = '.json';
  }
  const mapFile = userInput + extension;

  // if --appmap-file is a valid exact path, then return it
  // or resolve cwd and --appmap-file and check for an exact match
  const absoluteUserInput = path.resolve(process.cwd(), mapFile);
  if (existsSync(absoluteUserInput)) return absoluteUserInput;

  // resolve --appmap-dir against CWD. If it's an absolute path, it'll remain unchanged.
  // If it's relative, it'll be resolved against CWD.
  const absoluteAppmapDir = path.resolve(process.cwd(), appmapDir);
  const searchPath = path.join(absoluteAppmapDir, mapFile);
  if (existsSync(searchPath)) return searchPath;

  console.error(chalk.red('No matching AppMap found'));
  return;
}

export default async function handler(
  argv: any,
  handlerCaller = 'from_stats'
): Promise<EventInfo[] | Promise<[SortedAppMapSize[], SlowestExecutionTime[]]> | undefined> {
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
