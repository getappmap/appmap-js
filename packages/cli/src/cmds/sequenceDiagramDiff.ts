import { readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import yargs from 'yargs';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import buildDiffDiagram from '../sequenceDiagram/buildDiffDiagram';
import diff from '../sequenceDiagram/diff';
import { Action, Diagram } from '../sequenceDiagram/types';
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
  args.option('format', {
    describe: 'output format',
    choices: ['mermaid', 'plantuml', 'json'],
    default: 'mermaid',
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);

  const { baseDiagram: baseDiagramFile, headDiagram: headDiagramFile } = argv;

  const formatter = require(`../sequenceDiagram/formatter/${argv.format}`);

  const baseDiagram = JSON.parse(await readFile(baseDiagramFile, 'utf-8')) as Diagram;
  const headDiagram = JSON.parse(await readFile(headDiagramFile, 'utf-8')) as Diagram;

  const result = diff(baseDiagram, headDiagram);

  const diagram = buildDiffDiagram(result);

  const template = formatter.format(diagram, `Diff ${baseDiagramFile} with ${headDiagramFile}`);
  await writeFile(join(dirname(headDiagramFile), ['diff', formatter.extension].join('')), template);
};
