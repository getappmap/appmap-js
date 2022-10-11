import { readFile } from 'fs/promises';
import yargs from 'yargs';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import diff from '../sequenceDiagram/diff';
import { Diagram } from '../sequenceDiagram/types';
import { verbose } from '../utils';

export const command = 'sequence-diagram-diff base-diagram head-diagram';
export const describe = 'Diff two sequence diagrams that are represented as JSON';

export const builder = (args: yargs.Argv) => {
  args.positional('base-diagram', {
    describe: 'base diagram to compare',
  });
  args.positional('head-diagram', {
    describe: 'head diagram to compare',
  });

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);

  const { baseDiagram: baseDiagramFile, headDiagram: headDiagramFile } = argv;

  const baseDiagram = JSON.parse(await readFile(baseDiagramFile, 'utf-8')) as Diagram;
  const headDiagram = JSON.parse(await readFile(headDiagramFile, 'utf-8')) as Diagram;

  const result = diff(baseDiagram, headDiagram);
  console.log(result.join('\n'));
};
