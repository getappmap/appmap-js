import yargs from 'yargs';
import lazyHandler from '../lib/lazyHandler';

export const command = 'sequence-diagram-diff base-diagram head-diagram';
export const describe = 'Diff sequence diagrams that are represented as JSON';

export const builder = (args: yargs.Argv) => {
  args.positional('base-diagram', {
    describe: 'base diagram file or directory to compare',
  });
  args.positional('head-diagram', {
    describe: 'head diagram file or directory to compare',
  });

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('output-dir', {
    describe: 'directory in which to save the sequence diagrams',
    default: '.',
  });
  args.option('format', {
    describe: 'output format',
    alias: 'f',
    choices: ['plantuml', 'json', 'text'],
    default: 'plantuml',
  });

  args.option('include', {
    describe: 'code objects to include in the diagram (inclusive of descendants)',
  });
  args.option('exclude', {
    describe: 'code objects to exclude from the diagram',
  });

  args.option('validate', {
    describe: 'enable diagram validation',
    type: 'boolean',
    default: true,
  });

  return args.strict();
};

export const handler = lazyHandler(() => import('./sequenceDiagramDiffHandler'));
