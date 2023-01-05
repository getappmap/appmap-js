import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import yargs from 'yargs';
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
import agentIsRecording from './record/state/agentIsRecording';

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
  args.option('loops', {
    describe: 'identify loops and collect under a Loop object',
    type: 'boolean',
    default: true,
  });
  args.option('format', {
    describe: 'output format',
    alias: 'f',
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

  if (!Formatters.includes(argv.format)) {
    console.log(`Invalid format: ${argv.format}`);
    process.exitCode = 1;
    return;
  }

  const generateDiagram = async (appmapFileName: string): Promise<void> => {
    const appmapData = JSON.parse(await readFile(appmapFileName, 'utf-8'));
    const appmap = buildAppMap().source(appmapData).build();

    const specOptions = {
      loops: argv.loops,
    } as SequenceDiagramOptions;
    if (argv.exclude)
      specOptions.exclude = Array.isArray(argv.exclude) ? argv.exclude : [argv.exclude];

    const specification = Specification.build(appmap, specOptions);

    const diagram = buildDiagram(appmapFileName, appmap, specification);
    const template = formatDiagram(argv.format, diagram, appmapFileName);

    if (argv.outputDir) await mkdir(argv.outputDir, { recursive: true });

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
  };

  for (let i = 0; i < argv.appmap.length; i++) {
    const appmapFile = argv.appmap[i];
    await generateDiagram(appmapFile);
  }
};
