import { queue } from 'async';
import { existsSync, statSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { promisify } from 'util';
import yargs from 'yargs';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { default as sequenceDiagramFormatter } from '@appland/sequence-diagram/dist/formatter';
import buildDiffDiagram from '@appland/sequence-diagram/dist/buildDiffDiagram';
import diff, { DiffOptions, MoveType } from '@appland/sequence-diagram/dist/diff';
import { Actor, Diagram, setParent } from '@appland/sequence-diagram/dist/types';
import { verbose } from '../utils';

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
    choices: ['plantuml', 'json'],
    default: 'plantuml',
  });

  return args.strict();
};

type Formatter = (diagram: Diagram, source: string) => string;

type SerializedAction = {
  caller?: string | Actor;
  callee?: string | Actor;
  children?: SerializedAction[];
};

async function readDiagramFile(fileName: string): Promise<Diagram> {
  const diagram = JSON.parse(await readFile(fileName, 'utf-8')) as Diagram;

  const actors = new Map<string, Actor>();
  diagram.actors.forEach((actor) => actors.set(actor.id, actor));

  const resolveActors = (action: SerializedAction): void => {
    if (action.caller) action.caller = actors.get(action.caller as string);
    if (action.callee) action.callee = actors.get(action.callee as string);
    if (action.children) action.children.forEach((child) => resolveActors(child));
  };

  diagram.rootActions.forEach((action) => setParent(action));
  diagram.rootActions.forEach((action) => resolveActors(action as SerializedAction));

  return diagram;
}

async function performDiff(
  formatter: Formatter,
  outputFileName: string,
  baseFileName: string,
  base: Diagram,
  head: Diagram,
  headFileName?: string
): Promise<Diagram | undefined> {
  const result = diff(base, head, {} as DiffOptions);

  const changes = result.positions.filter((state) => state.moveType !== MoveType.AdvanceBoth);
  if (changes.length === 0) {
    if (headFileName) {
      console.log(`${baseFileName} and ${headFileName} are identical`);
    } else {
      console.log(`${baseFileName} are identical`);
    }
    return;
  }

  const diagram = buildDiffDiagram(result);
  let description: string;
  if (headFileName) {
    description = `Diff ${baseFileName} with ${headFileName}`;
  } else {
    description = `Diff ${baseFileName}`;
  }

  const template = formatter(diagram, description);
  await writeFile(outputFileName, template);

  return diagram;
}

export const handler = async (argv: any) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  await mkdir(argv.outputDir, { recursive: true });

  const { baseDiagram: baseDiagramFile, headDiagram: headDiagramFile } = argv;

  const formatter = sequenceDiagramFormatter[argv.format];
  if (!formatter) {
    console.log(`Invalid format: ${argv.format}`);
    process.exitCode = 1;
    return;
  }

  [baseDiagramFile, headDiagramFile].forEach((fileName) => {
    if (!existsSync(fileName)) throw new Error(`${fileName} does not exist`);
  });

  const compareFiles = async (): Promise<void> => {
    const baseDiagram = await readDiagramFile(baseDiagramFile);
    const headDiagram = await readDiagramFile(headDiagramFile);

    performDiff(
      formatter.format,
      'diff',
      baseDiagramFile,
      baseDiagram,
      headDiagram,
      headDiagramFile
    );
  };

  const compareDirectories = async (): Promise<void> => {
    const diagramData: Map<string, { diagrams: Map<string, Diagram> }> = new Map();
    diagramData.set(baseDiagramFile, {
      diagrams: new Map<string, Diagram>(),
    });
    diagramData.set(headDiagramFile, {
      diagrams: new Map<string, Diagram>(),
    });

    await Promise.all(
      [...diagramData.keys()].map(async (dirName) => {
        const data = diagramData.get(dirName)!;
        await promisify(glob)(`${dirName}/**/*.json`).then(async (matches) => {
          const loader = queue(async (matchName: string) => {
            const diagram = await readDiagramFile(matchName);
            const relativePath = matchName.slice(dirName.length + 1);
            data.diagrams.set(relativePath, diagram);
          }, 2);
          matches.forEach((fileName) => loader.push(fileName));
          await loader.drain();
        });
      })
    );

    const diagramNames = new Set<string>();
    for (const fileName of diagramData.get(baseDiagramFile)!.diagrams.keys())
      diagramNames.add(fileName);
    for (const fileName of diagramData.get(headDiagramFile)!.diagrams.keys())
      diagramNames.add(fileName);

    for (const fileName of diagramNames) {
      if (diagramData.get(baseDiagramFile)!.diagrams.get(fileName) === undefined) {
        console.log(`Diagram ${fileName} exists only in ${headDiagramFile}`);
        continue;
      }
      if (diagramData.get(headDiagramFile)!.diagrams.get(fileName) === undefined) {
        console.log(`Diagram ${fileName} exists only in ${baseDiagramFile}`);
        continue;
      }

      performDiff(
        formatter.perform,
        fileName,
        fileName,
        diagramData.get(baseDiagramFile)!.diagrams.get(fileName)!,
        diagramData.get(headDiagramFile)!.diagrams.get(fileName)!
      );
    }
  };

  const isFile = [baseDiagramFile, headDiagramFile].map((fileName) => statSync(fileName).isFile());
  if (isFile.every(Boolean)) {
    await compareFiles();
  } else if (isFile.every((b) => !b)) {
    await compareDirectories();
  } else {
    throw new Error(`Both arguments must be files, or be directories`);
  }
};
