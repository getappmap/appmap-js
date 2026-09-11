import yargs from 'yargs';
import lazyHandler from '../../lib/lazyHandler';

export const command = 'search <query>';
export const describe =
  'Search AppMaps, or a single AppMap, for search matches to a full-text query.';

export const builder = (args: yargs.Argv) => {
  args.positional('query', {
    describe: 'full-text query',
    type: 'string',
    demandOption: true,
  });

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('find-events', {
    describe: 'find events within AppMap search results',
    type: 'boolean',
  });

  args.option('context-depth', {
    describe: 'depth of call stack context to include around search matches',
    type: 'number',
    default: 2,
  });

  args.option('appmap', {
    describe: 'AppMap to search',
    type: 'string',
    alias: 'a',
  });

  args.option('max-results', {
    describe: 'maximum number of search results to return',
    type: 'number',
  });

  args.option('max-size', {
    describe: 'prune AppMap to a maximum size before searching (used only with --appmap option)',
    type: 'string',
  });

  args.option('filter', {
    describe: 'serialized AppMap filter to apply to the AppMap (used only with --appmap option)',
    type: 'string',
  });

  args.option('show', {
    describe: 'open AppMaps in a visual tool such as VSCode or the browser',
    boolean: false,
  });

  args.option('format', {
    describe:
      'output format to use for printing the output. json: JSON serialization of the search results. appmap: AppMap data focused on the search results (only available with --appmap or --find-events options)',
    choices: ['json', 'appmap'],
    default: 'json',
    alias: 'f',
  });

  return args.strict();
};

export const handler = lazyHandler(() => import('./searchHandler'));
