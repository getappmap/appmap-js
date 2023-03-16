import yargs from 'yargs';
import { statsForDirectory } from './directory/statsForDirectory';
import { EventInfo, statsForMap } from './directory/statsForMap';
import { SortedAppMapSize } from './types/appMapSize';
import { SlowestExecutionTime } from './types/functionExecutionTime';

export const command = 'stats [directory]';
export const describe =
  'Show statistics about events from an AppMap or from all AppMaps in a directory';
const LIMIT_DEFAULT = 10;

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'Working directory for the command',
    type: 'string',
    alias: 'd',
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
  if (argv.appmapFile) {
    return await statsForMap(argv.format, argv.limit, argv.appmapFile);
  }
  return await statsForDirectory(
    argv.verbose,
    argv.directory,
    argv.format,
    argv.limit,
    handlerCaller
  );
}

export default {
  command: command,
  describe: describe,
  builder: builder,
  handler: handler,
};
