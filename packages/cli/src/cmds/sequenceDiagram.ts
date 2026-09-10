import yargs from 'yargs';
import lazyHandler from '../lib/lazyHandler';

export const command = 'sequence-diagram <appmap...>';
export const describe = 'Generate a sequence diagram for an AppMap';

export const builder = (args: yargs.Argv) => {
  args.positional('appmap', {
    type: 'string',
    array: true,
  });

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('output-dir', {
    describe: 'directory in which to save the sequence diagrams',
  });
  args.option('show-browser', {
    describe: 'when using a browser to render the diagram, show the browser window',
    type: 'boolean',
    default: false,
  });
  args.option('loops', {
    describe: 'identify loops and collect under a Loop object',
    type: 'boolean',
    default: true,
  });
  args.option('format', {
    describe: 'output format',
    alias: 'f',
    choices: ['png', 'plantuml', 'json'],
    default: 'png',
  });
  args.option('filter', {
    describe: 'Filter to use to prune the map',
    type: 'string',
  });
  args.option('exclude', {
    describe: 'code objects to exclude from the diagram',
    deprecated: true,
  });
  args.option('expand', {
    describe: 'code objects to expand in the diagram',
  });

  return args.strict();
};

export const handler = lazyHandler(() => import('./sequenceDiagramHandler'));
