import yargs from 'yargs';
import { statsForDirectory } from './directory/statsForDirectory';
import { statsForMap } from './directory/statsForMap';

export const command = 'stats [directory]';
export const describe =
  'Show statistics about events from an AppMap or from all AppMaps in a directory';
const LIMIT_DEFAULT = 10;

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'Directory to analyze',
    type: 'string',
    alias: 'd',
  });

  args.option('json', {
    describe: 'Format results as JSON',
    type: 'boolean',
    alias: 'j',
  });

  args.option('limit', {
    describe: 'Number of methods to display',
    type: 'number',
    alias: 'l',
    default: LIMIT_DEFAULT,
  });

  args.option('map', {
    describe: 'AppMap to analyze',
    type: 'string',
    alias: 'm',
  });

  return args.strict();
};

export async function handler(argv: any, handlerCaller: string = 'from_stats') {
  if (argv.map) {
    await statsForMap(argv);
  } else {
    await statsForDirectory(argv, handlerCaller);
  }
}

export default {
  command: command,
  describe: describe,
  builder: builder,
  handler: handler,
};
