import yargs from 'yargs';
import lazyHandler from '../../lib/lazyHandler';

export const command = 'inventory [output-file]';
export const describe = 'Generate a JSON report describing the contents of a repository.';

export const builder = (args: yargs.Argv) => {
  args.positional('output-file', {
    type: 'string',
    describe: `output file to write the JSON report. If this option is not provided, the report is written to stdout`,
    demandOption: false,
  });

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });

  args.option('resource-tokens', {
    describe: `number of path tokens to include in the 'by resource' output`,
    type: 'number',
    default: 2,
  });

  args.option('resource-tokens', {
    describe: `number of path tokens to include in the 'by resource' output`,
    type: 'number',
    default: 2,
  });

  args.option('large-appmaps', {
    describe: `number of largest AppMaps to report`,
    type: 'number',
    default: 20,
  });

  args.option('frequent-functions', {
    describe: `number of most frequently occurring functions to report (this is an estimate based on inspecting the large AppMaps)`,
    type: 'number',
    default: 50,
  });

  return args.strict();
};

export const handler = lazyHandler(() => import('./inventoryHandler'));
