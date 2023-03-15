import yargs from 'yargs';
import { statsForDirectory } from './directory/statsForDirectory';

export const command = 'stats [directory]';
export const describe = 'Show some statistics about events in scenarios read from AppMap files';
const LIMIT_DEFAULT = 10;

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'Working directory for the command.',
    type: 'string',
    alias: 'd',
  });

  args.option('json', {
    describe: 'Format results as JSON.',
    type: 'boolean',
    alias: 'j',
  });

  args.option('limit', {
    describe: 'limit the number of methods displayed (default ' + LIMIT_DEFAULT + ').',
    type: 'number',
    alias: 'l',
    default: LIMIT_DEFAULT,
  });

  return args.strict();
};

export async function handler(argv: any, handlerCaller: string = 'from_stats') {
  await statsForDirectory(argv, handlerCaller);
}

export default {
  command: command,
  describe: describe,
  builder: builder,
  handler: handler,
};
