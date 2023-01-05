import { copyFile, mkdir, readFile, rename, rm, writeFile } from 'fs/promises';
import yargs from 'yargs';
import readline from 'readline';

import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../lib/locateAppMapDir';
import { fingerprintDirectory } from '../fingerprint';
import Depends from '../depends';
import { exists, verbose } from '../utils';
import { exec } from 'child_process';
import { cwd, nextTick, rawListeners } from 'process';
import { queue } from 'async';
import { basename, isAbsolute, join, relative } from 'path';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import {
  Action,
  buildDiagram,
  Diagram,
  format,
  FormatType,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';
import { AppMap, CodeObject, buildAppMap } from '@appland/models';
import { glob } from 'glob';
import { promisify } from 'util';
import { DiffDiagrams } from '../sequenceDiagramDiff/DiffDiagrams';
import { readDiagramFile } from './sequenceDiagram/readDiagramFile';
import assert from 'assert';
import { touch } from '../touchFile';
import chalk from 'chalk';

export const command = 'describe-change';
export const describe = 'Compare base and head revisions';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('base-revision', {
    describe: 'base revision name or commit SHA (default is the previous commit)',
    alias: 'base',
  });
  args.option('head-revision', {
    describe: 'head revision name or commit SHA (default is the current commit)',
    alias: 'head',
  });

  args.option('output-dir', {
    describe: 'directory in which to save the report files',
  });
  args.option('clobber-output-dir', {
    describe: 'remove the output directory if it exists',
    type: 'boolean',
    default: false,
  });

  args.option('base-command', {
    describe: 'command to use to run the base tests',
  });
  args.option('head-command', {
    describe: 'command to use to run the head tests',
  });

  args.option('touch', {
    describe: 'touch out-of-date test files when switching to a new revision',
    type: 'boolean',
    default: false,
  });

  args.option('plantuml-jar', {
    describe: 'location of PlantUML JAR file',
    default: 'plantuml.jar',
  });

  args.option('include', {
    describe: 'code objects to include in the comparison (inclusive of descendants)',
  });
  args.option('exclude', {
    describe: 'code objects to exclude from the comparison',
  });

  return args.strict();
};

enum RevisionName {
  Base = 'base',
  Head = 'head',
  Diff = 'diff',
}

class AppMapReference {
  public sourcePaths = new Set<string>();
  public sourceLocation: string | undefined;
  public appmapName: string | undefined;

  constructor(public outputDir: string, public appmapFileName: string) {}

  sequenceDiagramFileName(format: string): string {
    return [basename(this.appmapFileName, '.appmap.json'), `sequence.${format}`].join('.');
  }

  sequenceDiagramFilePath(
    revisionName: RevisionName,
    format: FormatType | string,
    includeOutputDir: boolean
  ): string {
    const tokens = [revisionName, this.sequenceDiagramFileName(format)];
    if (includeOutputDir) tokens.unshift(this.outputDir);
    return join(...tokens);
  }

  archivedAppMapFilePath(revisionName: RevisionName): string {
    return join(this.outputDir, revisionName, basename(this.appmapFileName));
  }

  async loadSequenceDiagramJSON(revisionName: RevisionName): Promise<Diagram> {
    return readDiagramFile(this.sequenceDiagramFilePath(revisionName, FormatType.JSON, true));
  }

  async loadSequenceDiagramText(revisionName: RevisionName): Promise<string> {
    return await readFile(
      this.sequenceDiagramFilePath(revisionName, FormatType.Text, true),
      'utf-8'
    );
  }

  async buildSequenceDiagram(): Promise<Diagram> {
    const specOptions = { loops: false } as SequenceDiagramOptions;
    const appmap = await this.buildAppMap();
    const specification = Specification.build(appmap, specOptions);
    return buildDiagram(this.appmapFileName, appmap, specification);
  }

  async buildAppMap(): Promise<AppMap> {
    const appmapData = JSON.parse(await readFile(this.appmapFileName, 'utf-8'));
    const appmap = buildAppMap().source(appmapData).build();
    if (appmap.metadata) {
      if (!this.sourceLocation) this.sourceLocation = (appmap.metadata as any).source_location;
      if (!this.appmapName) this.appmapName = appmap.metadata.name;
    }
    const collectSourcePath = (codeObject: CodeObject) => {
      const location = codeObject.location;
      if (location) {
        const path = location.split(':')[0];
        if (!isAbsolute(path)) this.sourcePaths.add(path);
      }
    };
    appmap.classMap.visit(collectSourcePath);
    return appmap;
  }
}

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.on('close', function () {
    yargs.exit(0, new Error());
  });

  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir();

  const { touch: touchOutDateTestFiles, plantumlJar, baseCommand, headCommand } = argv;
  let { outputDir } = argv;

  if (!(await exists(plantumlJar))) {
    yargs.exit(
      1,
      new Error(
        `PlantUML JAR file ${plantumlJar} does not exist. Use --plantuml-jar option to provide the JAR file location.`
      )
    );
  }

  let currentBranch = (await executeCommand(`git branch --show-current`)).trim();
  if (currentBranch === '') {
    currentBranch = (await executeCommand(`git show --format=oneline --abbrev-commit`)).split(
      /\s/
    )[0];
  }

  console.log(prominentStyle(`Current revision is: ${currentBranch}`));
  console.log(
    mutedStyle(
      `Note: The repository will be returned to this revision if this command succeeds, but not if it fails.`
    )
  );

  const baseRevision = argv.baseRevision || 'HEAD~1';
  const headRevision = argv.headRevision || (currentBranch || 'HEAD').trim();

  if (!outputDir) {
    outputDir = `revision-report/${sanitizeRevision(baseRevision)}-${sanitizeRevision(
      headRevision
    )}`;
  }

  if (await exists(outputDir)) {
    if (
      argv.clobberOutputDir ||
      (await confirm(`Remove existing output directory ${outputDir}?`, rl))
    ) {
      await rm(outputDir, { recursive: true, force: true });
      // Rapid rm and then mkdir will silently fail in practice.
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
  }

  // stashAll()

  await mkdir(outputDir, { recursive: true });
  await mkdir(join(outputDir, 'base'), { recursive: true });
  await mkdir(join(outputDir, 'head'), { recursive: true });
  await mkdir(join(outputDir, 'diff'), { recursive: true });

  const appmapReferences = new Map<string, AppMapReference>();
  let baseAppMapFileNames: Set<string>;
  let headAppMapFileNames: Set<string>;
  {
    await checkout('base', baseRevision);
    await createBaselineAppMaps(rl, baseCommand);
    process.stdout.write(`Processing AppMaps...`);
    baseAppMapFileNames = new Set([
      ...(await processAppMaps(appmapDir, outputDir, RevisionName.Base, appmapReferences)),
    ]);
    process.stdout.write(`done (${baseAppMapFileNames.size})\n`);
  }

  {
    await checkout('head', headRevision);
    await updateAppMaps(appmapDir, rl, touchOutDateTestFiles, headCommand);
    process.stdout.write(`Processing AppMaps...`);
    headAppMapFileNames = new Set([
      ...(await processAppMaps(appmapDir, outputDir, RevisionName.Head, appmapReferences)),
    ]);
    process.stdout.write(`done (${headAppMapFileNames.size})\n`);
  }

  // unstashAll()

  const headAppMapFileNameArray = [...headAppMapFileNames].sort();
  const changedAppMaps = new Array<AppMapReference>();
  const diffSnippets = new Set<string>();
  const reportLines = new Array<string>();
  for (let i = 0; i < headAppMapFileNameArray.length; i++) {
    const appmapFileName = headAppMapFileNameArray[i];
    const appmapReference = appmapReferences.get(appmapFileName);
    assert(appmapReference);

    if (!baseAppMapFileNames.has(appmapFileName)) {
      console.log(`${appmapFileName} is new in the head revision`);
      await reportDiagram(
        RevisionName.Head,
        outputDir,
        baseRevision,
        appmapReference,
        reportLines,
        'is new in the head revision',
        rl,
        plantumlJar,
        undefined
      );
      continue;
    }

    const diffDiagrams = new DiffDiagrams();

    if (argv.include)
      (Array.isArray(argv.include) ? argv.include : [argv.include]).forEach((expr: string) =>
        diffDiagrams.include(expr)
      );
    if (argv.exclude)
      (Array.isArray(argv.exclude) ? argv.exclude : [argv.exclude]).forEach((expr: string) =>
        diffDiagrams.exclude(expr)
      );

    let diffDiagram: Diagram | undefined;
    const baseDiagram = await appmapReference.loadSequenceDiagramJSON(RevisionName.Base);
    const headDiagram = await appmapReference.loadSequenceDiagramJSON(RevisionName.Head);
    try {
      diffDiagram = diffDiagrams.diff(baseDiagram, headDiagram);
      if (!diffDiagram) continue;
    } catch (e) {
      console.warn(`Error comparing ${appmapFileName} ${baseRevision}..${headRevision}: ${e}`);
      continue;
    }

    const diffActions = new Set<Action>();
    const markDiffActions = (action: Action): void => {
      if (action.diffMode) {
        let ancestor: Action | undefined = action;
        while (ancestor) {
          diffActions.add(ancestor);
          ancestor = ancestor.parent;
        }
      }
      action.children.forEach(markDiffActions);
    };

    diffDiagram.rootActions.forEach(markDiffActions);

    const filterDiffActions = (actions: Action[]): Action[] => {
      const result = actions.filter((action) => diffActions.has(action));
      result.forEach((action) => {
        action.children = filterDiffActions(action.children);
      });
      return result;
    };
    diffDiagram.rootActions = filterDiffActions(diffDiagram.rootActions);

    await writeFile(
      appmapReference.sequenceDiagramFilePath(RevisionName.Diff, FormatType.JSON, true),
      format(FormatType.JSON, diffDiagram, `Compare ${appmapFileName}`).diagram
    );

    const diffText = format(
      FormatType.Text,
      diffDiagram,
      `Compare ${appmapFileName}`
    ).diagram.trim();

    await writeFile(
      appmapReference.sequenceDiagramFilePath(RevisionName.Diff, FormatType.Text, true),
      diffText
    );

    if (diffSnippets.has(diffText)) continue;
    diffSnippets.add(diffText);

    changedAppMaps.push(appmapReference);
  }

  console.log(
    prominentStyle(`${changedAppMaps.length} AppMaps have changed between these two code versions.`)
  );
  console.log();

  for (let i = 0; i < changedAppMaps.length; i++) {
    const appmapReference = changedAppMaps[i];
    const diagramText = await appmapReference.loadSequenceDiagramText(RevisionName.Diff);
    const diffDiagram = await appmapReference.loadSequenceDiagramJSON(RevisionName.Diff);

    console.log(prominentStyle(`${appmapReference.appmapFileName} changed:`));
    console.log(diagramText);
    console.log();
    let diagramFile = await showDiagram(rl, plantumlJar, diffDiagram);

    await reportDiagram(
      RevisionName.Diff,
      outputDir,
      baseRevision,
      appmapReference,
      reportLines,
      'has changed',
      rl,
      plantumlJar,
      diagramFile
    );
  }

  if (outputDir) {
    await writeFile(join(outputDir, 'report.md'), reportLines.join('\n'));
  }

  rl.close();
};

async function ask(rl: readline.Interface, q: string): Promise<string> {
  return new Promise<string>((resolve) => {
    rl.question(q, resolve);
  });
}

async function createBaselineAppMaps(rl: readline.Interface, testCommand?: string): Promise<void> {
  if (testCommand) {
    await executeCommand(testCommand);
    return;
  }

  console.log(
    prominentStyle(`Run the tests for this revision in a separate terminal. For example:`)
  );
  console.log(`  rails test`);
  await waitForEnter(rl);
}

async function updateAppMaps(
  appmapDir: string,
  rl: readline.Interface,
  touchOutDateTestFiles: boolean,
  testCommand?: string
): Promise<number> {
  await indexAppMaps(appmapDir);
  const testFileNames = await enumerateOutOfDateTestFiles(appmapDir, rl);
  if (testFileNames.length === 0) return 0;

  console.log(prominentStyle(`${testFileNames.length} tests are out of date.`));

  const fileName = makeTempFile('outOfDateTests.txt');
  writeFile(fileName, testFileNames.sort().join('\n'));
  if (touchOutDateTestFiles) {
    testFileNames.forEach(touch);
  }

  if (testCommand) {
    await executeCommand(testCommand);
    return testFileNames.length;
  }

  console.log(`A list of the test cases that are out-of-date has been written to a temp file:`);
  console.log(`\t${fileName}`);
  if (touchOutDateTestFiles) {
    console.log(`Each file has also been "touched".`);
  }

  console.log(`Re-run these tests in a separate terminal. For example:`);
  console.log(`  cat ${fileName} | xargs rails test`);
  console.log();
  await waitForEnter(rl);
  return testFileNames.length;
}

async function enumerateOutOfDateTestFiles(
  appmapDir: string,
  rl: readline.Interface
): Promise<string[]> {
  const depends = new Depends(appmapDir);
  const outOfDateAppMapNames = await depends.depends((appmapName: string) => {});
  const testFileNames = new Set<string>();
  if (outOfDateAppMapNames.length > 0) {
    const q = queue(async (appMapBaseName: string) => {
      const data = await readFile(join(appMapBaseName, 'metadata.json'), 'utf-8');
      const metadata = JSON.parse(data);
      const value = metadata['source_location'] as string;
      if (value) {
        const tokens = value.split(':');
        testFileNames.add(tokens[0]);
      } else {
        console.warn(warningStyle(`No source_location in ${appMapBaseName}`));
      }
    }, 5);
    outOfDateAppMapNames.forEach((name) => q.push(name));
    await q.drain();
  }

  return [...testFileNames].sort();
}

async function checkout(revisionName: string, revision: string): Promise<void> {
  console.log();
  console.log(actionStyle(`Switching to ${revisionName} revision: ${revision}`));
  await executeCommand(`git checkout ${revision}`, false, false);
  console.log();
}

async function indexAppMaps(appmapDir: string): Promise<void> {
  console.log(mutedStyle(`Indexing AppMaps in ${cwd()}`));
  await fingerprintDirectory(appmapDir);
}

function makeTempFile(fileName: string): string {
  if (existsSync('tmp')) return join('tmp', fileName);

  return join(tmpdir(), fileName);
}

async function processAppMaps(
  appmapDir: string,
  outputDir: string,
  revisionName: RevisionName,
  appmapReferences: Map<string, AppMapReference>
): Promise<string[]> {
  const appmapFileNames = await promisify(glob)(`${appmapDir}/**/*.appmap.json`);
  for (let i = 0; i < appmapFileNames.length; i++) {
    const appmapFileName = appmapFileNames[i];
    const appmapReference = new AppMapReference(outputDir, appmapFileName);
    const diagram = await appmapReference.buildSequenceDiagram();
    await copyFile(appmapFileName, appmapReference.archivedAppMapFilePath(revisionName));
    await writeFile(
      appmapReference.sequenceDiagramFilePath(revisionName, FormatType.JSON, true),
      format(FormatType.JSON, diagram, appmapFileName).diagram
    );
    if (!appmapReferences.get(appmapFileName)) {
      appmapReferences.set(appmapFileName, appmapReference);
    }
  }
  return appmapFileNames;
}

async function confirm(prompt: string, rl: readline.Interface): Promise<boolean> {
  return (await ask(rl, `${prompt} (y/n) `)) === 'y';
}

async function showDiagram(
  rl: readline.Interface,
  plantumlJar: string,
  diagram: Diagram | undefined
): Promise<string | undefined> {
  if (!diagram) return;

  if (!(await confirm('Open diagram?', rl))) {
    return;
  }

  const fileNameSVG = await renderDiagram(plantumlJar, diagram);
  await executeCommand(`open ${fileNameSVG}`);
  await waitForEnter(rl);
  return fileNameSVG;
}

/*
async function stashAll(): Promise<void> {
  console.log(`Stashing all modified and untracked files`);
  await executeCommand(`git stash --include-untracked`);
}

async function unstashAll(): Promise<void> {
  console.log(`Restoring modified and untracked files`);
  try {
    await executeCommand(`git stash pop`);
  } catch {
    console.log(warningStyle(`Command failed. Continuing optimistically...`));
  }
}
*/

function executeCommand(cmd: string, printStdout = true, printStderr = true): Promise<string> {
  console.log(commandStyle(cmd));
  const command = exec(cmd);
  const result: string[] = [];
  if (command.stdout) {
    command.stdout.addListener('data', (data) => {
      if (printStdout) process.stdout.write(data);
      result.push(data);
    });
  }
  if (printStderr && command.stderr) command.stderr.pipe(process.stdout);
  return new Promise<string>((resolve, reject) => {
    command.addListener('exit', (code) => {
      if (code === 0) {
        resolve(result.join(''));
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

function warningStyle(message: string): string {
  return chalk.yellow(message);
}
function actionStyle(message: string): string {
  return chalk.bold(chalk.green(message));
}
function prominentStyle(message: string): string {
  return chalk.bold(message);
}
function mutedStyle(message: string): string {
  return chalk.dim(message);
}
function commandStyle(message: string): string {
  return chalk.gray(`$ ${message}`);
}
async function waitForEnter(rl: readline.Interface): Promise<void> {
  console.log(prominentStyle(`Press Enter to continue...`));
  await new Promise<void>((resolve) => {
    const listener = () => {
      rl.removeListener('line', listener);
      resolve();
    };
    rl.addListener('line', listener);
  });
}

async function renderDiagram(plantumlJar: string, diagram: Diagram): Promise<string> {
  const plantUML = format(FormatType.PlantUML, diagram, `Diagram`);
  const fileNameUML = makeTempFile(`sequence${plantUML.extension}`);
  const fileNameSVG = makeTempFile(`sequence.svg`);
  await writeFile(fileNameUML, plantUML.diagram);
  await executeCommand(`java -jar ${plantumlJar} -tsvg ${fileNameUML}`);
  return fileNameSVG;
}

async function reportDiagram(
  revisionName: RevisionName,
  outputDir: string,
  baseRevision: string,
  appmapReference: AppMapReference,
  reportLines: string[],
  message: string,
  rl: readline.Interface,
  plantumlJar: any,
  diagramFile?: string
): Promise<void> {
  if (await confirm(`Include in the change report?`, rl)) {
    const diagram = await appmapReference.loadSequenceDiagramJSON(revisionName);
    const diagramText = await appmapReference.loadSequenceDiagramText(revisionName);
    if (!diagramFile) diagramFile = await renderDiagram(plantumlJar, diagram);

    const appmapName = appmapReference.appmapName || appmapReference.appmapFileName;

    await rename(diagramFile, appmapReference.sequenceDiagramFilePath(revisionName, 'svg', true));
    reportLines.push(
      `## [${appmapName}](${appmapReference.sequenceDiagramFilePath(
        revisionName,
        'svg',
        false
      )}) ${message}.`
    );

    if (appmapReference.sourceLocation) {
      const sourcePath = appmapReference.sourceLocation.split(':')[0];
      const fileURL = isAbsolute(sourcePath)
        ? relative(outputDir, sourcePath)
        : relative(outputDir, join(process.cwd(), sourcePath));
      reportLines.push('');
      reportLines.push(`[${relative(process.cwd(), appmapReference.sourceLocation)}](${fileURL})`);
      reportLines.push('');
    }

    if (appmapReference.sourcePaths.size > 0) {
      const existingSourcePaths = [...appmapReference.sourcePaths].filter(existsSync).sort();
      const sourceDiff = await executeCommand(
        `git diff ${baseRevision} -- ${existingSourcePaths.join(' ')}`
      );
      reportLines.push('```');
      reportLines.push(sourceDiff);
      reportLines.push('```');
    }

    reportLines.push('');
    reportLines.push('');
    reportLines.push('```');
    reportLines.push(diagramText);
    reportLines.push('```');
    reportLines.push('');
    reportLines.push(
      `![${appmapName}](${appmapReference.sequenceDiagramFilePath(revisionName, 'svg', false)})`
    );
    reportLines.push('');
  }
}
function sanitizeRevision(revision: string): string {
  return revision.replace(/[^a-zA-Z0-9_]/g, '_');
}
