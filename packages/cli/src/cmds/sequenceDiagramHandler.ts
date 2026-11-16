import { mkdir, mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, dirname, join } from 'path';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { verbose } from '../utils';
import { AppMap, buildAppMap } from '@appland/models';
import {
  buildDiagram,
  SequenceDiagramOptions,
  Specification,
  format as formatDiagram,
  Formatters,
  FormatType,
} from '@appland/sequence-diagram';
import { Telemetry } from '@appland/telemetry';
import assert from 'assert';
import BrowserRenderer from './sequenceDiagram/browserRenderer';
import filterAppMap from '../lib/filterAppMap';

export default async function handler(argv: any) {
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

  if (argv.output && argv.appmap.length > 1) {
    console.log(`--output can only be used with a single AppMap; use --output-dir instead`);
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
    if (argv.output) await mkdir(dirname(argv.output), { recursive: true });

    const specification = Specification.build(appmap, specOptions);

    const diagram = buildDiagram(appmapFileName, appmap, specification);

    const printDiagram = async (format: FormatType, outputPath?: string): Promise<string> => {
      const template = formatDiagram(format, diagram, appmapFileName);
      const outputFileName = [
        basename(appmapFileName, '.appmap.json'),
        '.sequence',
        template.extension,
      ].join('');

      let resultPath: string;
      if (outputPath) resultPath = outputPath;
      else if (argv.outputDir) resultPath = join(argv.outputDir, outputFileName);
      else resultPath = join(dirname(appmapFileName), outputFileName);

      await writeFile(resultPath, template.diagram);
      return resultPath;
    };

    let outputPath: string;
    if (argv.format === 'png') {
      // PNG rendering is performed by loading the sequence
      // diagram in a browser and taking a screenshot.
      // With --output naming the PNG, the JSON is only an intermediate, so it
      // goes to a temporary directory: written beside the PNG, it could
      // overwrite some other file, such as the input AppMap.
      const tempDir = argv.output
        ? await mkdtemp(join(tmpdir(), 'appmap-sequence-diagram-'))
        : undefined;
      const diagramPath = await printDiagram(
        FormatType.JSON,
        tempDir && join(tempDir, 'diagram.sequence.json')
      );
      // Loaded here rather than at the top: serving the diagram brings in the
      // interactive prompt library, which most invocations never need.
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
      const serveAndOpen = require('../lib/serveAndOpen') as typeof import('../lib/serveAndOpen');
      outputPath = await new Promise((resolve) =>
        serveAndOpen.serveAndOpenSequenceDiagram(diagramPath, false, async (url) => {
          if (verbose()) console.warn(`Rendering PNG`);
          assert(browserRender, 'Browser not initialized');

          const outputPath =
            argv.output ??
            join(dirname(diagramPath), [basename(diagramPath, '.json'), '.png'].join(''));

          await browserRender.screenshot(url, outputPath);

          resolve(outputPath);
        })
      );
      if (tempDir) await rm(tempDir, { recursive: true, force: true });
      console.warn(`Printed diagram ${outputPath}`);
    } else {
      // Other forms of output are produced directly by the
      // sequence diagram library.
      outputPath = await printDiagram(argv.format, argv.output);
      console.log(`Printed diagram ${outputPath}`);
    }
  };

  for (const appmapFile of argv.appmap) {
    await generateDiagram(appmapFile);
  }

  if (browserRender) await browserRender.close();
}
