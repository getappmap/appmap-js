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
  FormatType,
} from '@appland/sequence-diagram';
import { renderSequenceDiagramPNG } from '../sequenceDiagram/renderSequenceDiagramPNG';
import assert from 'assert';
import BrowserRenderer from './sequenceDiagram/browserRenderer';

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

  if (argv.format !== 'png' && !Formatters.includes(argv.format)) {
    console.log(`Invalid format: ${argv.format}`);
    process.exitCode = 1;
    return;
  }

  let browserRender: BrowserRenderer | undefined;
  if (argv.format === 'png') {
    browserRender = new BrowserRenderer(argv.showBrowser);
  }

  const generateDiagram = async (appmapFileName: string): Promise<void> => {
    const appmapData = JSON.parse(await readFile(appmapFileName, 'utf-8'));
    const appmap = buildAppMap().source(appmapData).build();

    const specOptions = {
      loops: argv.loops,
    } as SequenceDiagramOptions;
    if (argv.exclude)
      specOptions.exclude = Array.isArray(argv.exclude) ? argv.exclude : [argv.exclude];

    if (argv.outputDir) await mkdir(argv.outputDir, { recursive: true });

    const specification = Specification.build(appmap, specOptions);

    const diagram = buildDiagram(appmapFileName, appmap, specification);

    const printDiagram = async (format: FormatType): Promise<string> => {
      const template = formatDiagram(format, diagram, appmapFileName);
      const outputFileName = [
        basename(appmapFileName, '.appmap.json'),
        '.sequence',
        template.extension,
      ].join('');

      let resultPath: string;
      if (argv.outputDir) resultPath = join(argv.outputDir, outputFileName);
      else resultPath = join(dirname(appmapFileName), outputFileName);

      await writeFile(resultPath, template.diagram);
      return resultPath;
    };

    if (argv.format === 'png') {
      // PNG rendering is performed by loading the sequence
      // diagram in a browser and taking a screenshot.
      assert(browserRender);
      const diagramPath = await printDiagram(FormatType.JSON);
      const outputPath = join(
        dirname(diagramPath),
        [basename(diagramPath, '.json'), '.png'].join('')
      );
      await renderSequenceDiagramPNG(outputPath, diagramPath, browserRender);

      console.warn(`Printed diagram ${outputPath}`);
    } else {
      // Other forms of output are produced directly by the
      // sequence diagram library.
      const outputPath = await printDiagram(argv.format);
      console.log(`Printed diagram ${outputPath}`);
    }
  };

  for (let i = 0; i < argv.appmap.length; i++) {
    const appmapFile = argv.appmap[i];
    await generateDiagram(appmapFile);
  }

  if (browserRender) await browserRender.close();
};
