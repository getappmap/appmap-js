import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import yargs from 'yargs';
import { default as sequenceDiagramFormatter } from '@appland/sequence-diagram/dist/formatter';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { verbose } from '../utils';
import { buildAppMap } from '@appland/models';
import Specification, {
  SequenceDiagramOptions,
} from '@appland/sequence-diagram/dist/specification';
import buildDiagram from '@appland/sequence-diagram/dist/buildDiagram';

export const command = 'sequence-diagram appmap';
export const describe = 'Generate a sequence diagram for an AppMap';

export const builder = (args: yargs.Argv) => {
  args.positional('appmap', {
    type: 'string',
    demandOption: true,
  });

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('output-dir', {
    describe: 'directory in which to save the sequence diagrams',
  });
  args.option('format', {
    describe: 'output format',
    choices: ['plantuml', 'json'],
    default: 'plantuml',
  });

  args.option('exclude', {
    describe: 'code objects to exclude from the diagram',
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);

  if (!argv.appmap) {
    console.log(`appmap argument is required`);
    process.exitCode = 1;
    return;
  }

  const formatter = sequenceDiagramFormatter[argv.format];
  if (!formatter) {
    console.log(`Invalid format: ${argv.format}`);
    process.exitCode = 1;
    return;
  }

  const appmapData = JSON.parse(await readFile(argv.appmap, 'utf-8'));
  const appmap = buildAppMap().source(appmapData).build();

  const specOptions = {} as SequenceDiagramOptions;
  if (argv.exclude && argv.exclude.length > 0) specOptions.exclude = argv.exclude;

  const specification = Specification.build(appmap, specOptions);

  const diagram = buildDiagram(argv.appmap, appmap, specification);
  const template = formatter.format(diagram, argv.appmap);

  if (argv.outputDir) await mkdir(argv.outputDir, { recursive: true });

  const outputFileName = [
    basename(argv.appmap, '.appmap.json'),
    '.sequence',
    formatter.extension,
  ].join('');

  let outputPath: string;
  if (argv.outputDir) outputPath = join(argv.outputDir, outputFileName);
  else outputPath = join(dirname(argv.appmap), outputFileName);

  await writeFile(outputPath, template);

  console.log(`Printed diagram ${outputPath}`);
};
