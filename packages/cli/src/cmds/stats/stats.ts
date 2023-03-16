import { chdir } from 'process';
import yargs from 'yargs';
import { statsForDirectory } from './directory/statsForDirectory';
import { EventInfo, statsForMap } from './directory/statsForMap';
import { SortedAppMapSize } from './types/appMapSize';
import { SlowestExecutionTime } from './types/functionExecutionTime';
import { verbose } from '../../utils';

export const command = 'stats [directory]';
export const describe =
  'Show statistics about events from an AppMap or from all AppMaps in a directory';
const LIMIT_DEFAULT = 10;

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

  return args.strict();
};

export async function handler(
  argv: any,
  handlerCaller: string = 'from_stats'
): Promise<Array<EventInfo> | Promise<[SortedAppMapSize[], SlowestExecutionTime[]]>> {
  const { directory, format, limit, appmapFile } = argv;
  const isVerbose = argv.verbose;

  if (isVerbose) console.log(`Using working directory ${directory}`);
  chdir(directory);

  if (appmapFile) {
    return await statsForMap(format, limit, appmapFile);
  }
  return await statsForDirectory(isVerbose, directory, format, limit, handlerCaller);
}

export default {
  command: command,
  describe: describe,
  builder: builder,
  handler: handler,
};
