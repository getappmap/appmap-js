import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import yargs from 'yargs';
import { default as sequenceDiagramFormatter } from '@appland/sequence-diagram/dist/formatter';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { verbose } from '../utils';
import { buildAppMap } from '@appland/models';
import {
  buildDiagram,
  SequenceDiagramOptions,
  Specification,
  format as formatDiagram,
  Formatters,
} from '@appland/sequence-diagram';

export const command = 'sequence-diagram [appmaps...]';
export const describe = 'Generate a sequence diagram for an AppMap';

export const builder = (args: yargs.Argv) => {
  args.positional('appmaps', {
    array: true,
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

  if (!argv.appmaps) {
    console.log(`appmaps argument is required`);
    process.exitCode = 1;
    return;
  }

  if (!Formatters.includes(argv.format)) {
    console.log(`Invalid format: ${argv.format}`);
    process.exitCode = 1;
    return;
  }

  const specOptions = {} as SequenceDiagramOptions;
  if (argv.exclude && argv.exclude.length > 0) specOptions.exclude = argv.exclude;

  if (argv.outputDir) await mkdir(argv.outputDir, { recursive: true });

  for (const appmapFileName of argv.appmaps) {
    const appmapData = JSON.parse(await readFile(appmapFileName, 'utf-8'));

    const appmap = buildAppMap().source(appmapData).build();

    const specification = Specification.build(appmap, specOptions);

    const diagram = buildDiagram(appmapFileName, appmap, specification);
    const template = formatDiagram(argv.format, diagram, appmapFileName);

    const outputFileName = [
      basename(appmapFileName, '.appmap.json'),
      '.sequence',
      template.extension,
    ].join('');

    let outputPath: string;
    if (argv.outputDir) outputPath = join(argv.outputDir, outputFileName);
    else outputPath = join(dirname(appmapFileName), outputFileName);

    await writeFile(outputPath, template.diagram);

    console.log(`Printed diagram ${outputPath}`);
  }
};
