import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import yargs from 'yargs';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { verbose } from '../utils';
import { AppMap, AppMapFilter, buildAppMap } from '@appland/models';
import {
  buildDiagram,
  SequenceDiagramOptions,
  Specification,
  format as formatDiagram,
  Formatters,
  FormatType,
} from '@appland/sequence-diagram';
import { Telemetry } from '@appland/telemetry';
import { serveAndOpenSequenceDiagram } from '../lib/serveAndOpen';
import assert from 'assert';
import BrowserRenderer from './sequenceDiagram/browserRenderer';
import filterAppMap from '../lib/filterAppMap';

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

  const { filter, expand } = argv;

  let browserRender: BrowserRenderer | undefined;

  // Record telemetry — this command is a bit niche, so we want to track
  // whether it's being used.
  Telemetry.sendEvent({
    name: 'command',
    properties: {
      command: 'sequence-diagram',
      format: argv.format,
      loops: argv.loops ? 'true' : 'false',
      filter: filter ? 'true' : 'false',
      expand: expand ? (Array.isArray(expand) ? 'multiple' : 'single') : 'false',
      exclude: argv.exclude ? (Array.isArray(argv.exclude) ? 'multiple' : 'single') : 'false',
    },
  });
  if (argv.format === 'png') {
    browserRender = new BrowserRenderer(argv.showBrowser);
  }
  const generateDiagram = async (appmapFileName: string): Promise<void> => {
    const appmapData = JSON.parse(await readFile(appmapFileName, 'utf-8'));
    let appmap: AppMap = buildAppMap().source(appmapData).build();
    if (filter) appmap = filterAppMap(appmap, filter);

    const specOptions = {
      loops: argv.loops,
    } as SequenceDiagramOptions;
    if (expand) specOptions.expand = Array.isArray(expand) ? expand : [expand];
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

    let outputPath: string;
    if (argv.format === 'png') {
      // PNG rendering is performed by loading the sequence
      // diagram in a browser and taking a screenshot.
      const diagramPath = await printDiagram(FormatType.JSON);
      outputPath = await new Promise((resolve) =>
        serveAndOpenSequenceDiagram(diagramPath, false, async (url) => {
          if (verbose()) console.warn(`Rendering PNG`);
          assert(browserRender, 'Browser not initialized');

          const outputPath = join(
            dirname(diagramPath),
            [basename(diagramPath, '.json'), '.png'].join('')
          );

          await browserRender.screenshot(url, outputPath);

          resolve(outputPath);
        })
      );
      console.warn(`Printed diagram ${outputPath}`);
    } else {
      // Other forms of output are produced directly by the
      // sequence diagram library.
      outputPath = await printDiagram(argv.format);
      console.log(`Printed diagram ${outputPath}`);
    }
  };

  for (const appmapFile of argv.appmap) {
    await generateDiagram(appmapFile);
  }

  if (browserRender) await browserRender.close();
};
