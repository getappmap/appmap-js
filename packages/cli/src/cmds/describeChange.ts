import { mkdir, readFile, rename, rm, writeFile } from 'fs/promises';
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
import { basename, dirname, join } from 'path';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import {
  buildDiagram,
  Diagram,
  format,
  FormatType,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';
import { glob } from 'glob';
import { promisify } from 'util';
import { buildAppMap } from '@appland/models';
import { DiffDiagrams } from '../sequenceDiagramDiff/DiffDiagrams';
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

  if (!(await exists(plantumlJar))) {
    yargs.exit(
      1,
      new Error(
        `PlantUML JAR file ${plantumlJar} does not exist. Use --plantuml-jar option to provide the JAR file location.`
      )
    );
  }

  if (argv.outputDir) {
    if (await exists(argv.outputDir)) {
      if (
        argv.clobberOutputDir ||
        !(await confirm(`Remove existing output directory ${argv.outputDir}?`, rl))
      ) {
        yargs.exit(1, new Error(`Aborted`));
      }
      await rm(argv.outputDir, { recursive: true, force: true });
    }
    await mkdir(argv.outputDir, { recursive: true });
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

  let baseDiagrams: Map<string, Diagram>;
  let headDiagrams: Map<string, Diagram>;

  await stashAll();
  {
    await checkout('base', baseRevision);
    await createBaselineAppMaps(rl, baseCommand);
    process.stdout.write(`Processing AppMaps...`);
    baseDiagrams = await buildDiagrams(appmapDir);
    process.stdout.write(`done (${baseDiagrams.size})\n`);
  }

  {
    await checkout('head', headRevision);
    await updateAppMaps(appmapDir, rl, touchOutDateTestFiles, headCommand);
    process.stdout.write(`Processing AppMaps...`);
    headDiagrams = await buildDiagrams(appmapDir);
    process.stdout.write(`done (${headDiagrams.size})\n`);
  }
  await unstashAll();

  const appmapNameSet = new Set<string>();
  [...baseDiagrams.keys()].forEach((file) => appmapNameSet.add(file));
  [...headDiagrams.keys()].forEach((file) => appmapNameSet.add(file));
  const appmapNames = [...appmapNameSet].sort();

  const changedAppMaps = new Map<string, { diffText: string; diffDiagram: Diagram }>();
  const diffSnippets = new Set<string>();
  const reportLines = new Array<string>();
  for (let i = 0; i < appmapNames.length; i++) {
    const appmapName = appmapNames[i];

    const baseDiagram = baseDiagrams.get(appmapName);
    const headDiagram = headDiagrams.get(appmapName);

    if (!baseDiagram) {
      assert(headDiagram);

      console.log(`${appmapName} is new in the head revision`);
      let diagramFile = await showDiagram(rl, plantumlJar, headDiagram);
      await reportDiagram(
        appmapName,
        reportLines,
        argv.outputDir,
        'is new in the head revision',
        diagramFile,
        rl,
        plantumlJar,
        headDiagram
      );
      continue;
    }
    if (!headDiagram) {
      console.log(`${appmapName} is removed in the head revision`);
      let diagramFile = await showDiagram(rl, plantumlJar, baseDiagram);
      await reportDiagram(
        appmapName,
        reportLines,
        argv.outputDir,
        'is removed from the head revision',
        diagramFile,
        rl,
        plantumlJar,
        baseDiagram
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
    try {
      diffDiagram = diffDiagrams.diff(baseDiagram, headDiagram);
      if (!diffDiagram) continue;
    } catch (e) {
      console.warn(`Error comparing ${appmapName} ${baseRevision}..${headRevision}: ${e}`);
      continue;
    }

    const diffText = format(FormatType.Text, diffDiagram, `Compare ${appmapName}`).diagram.trim();
    if (diffSnippets.has(diffText)) continue;

    diffSnippets.add(diffText);
    changedAppMaps.set(appmapName, { diffText, diffDiagram });
  }

  const changedAppMapNames = [...changedAppMaps.keys()].sort();
  console.log(
    prominentStyle(
      `${changedAppMapNames.length} AppMaps have changed between these two code versions.`
    )
  );
  console.log();

  for (let i = 0; i < changedAppMapNames.length; i++) {
    const appmapName = changedAppMapNames[i];
    const entry = changedAppMaps.get(appmapName);
    assert(entry);

    console.log(prominentStyle(`${appmapName} changed:`));
    console.log(entry.diffText);
    console.log();
    let diagramFile = await showDiagram(rl, plantumlJar, entry.diffDiagram);

    await reportDiagram(
      appmapName,
      reportLines,
      argv.outputDir,
      'has changed',
      diagramFile,
      rl,
      plantumlJar,
      entry.diffDiagram
    );
  }

  if (argv.outputDir) {
    await writeFile(join(argv.outputDir, 'report.md'), reportLines.join('\n'));
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

async function buildDiagrams(appmapDir: string): Promise<Map<string, Diagram>> {
  const result = new Map<string, Diagram>();
  const specOptions = {} as SequenceDiagramOptions;
  const appmapFileNames = await promisify(glob)(`${appmapDir}/**/*.appmap.json`);
  for (let i = 0; i < appmapFileNames.length; i++) {
    const appmapFileName = appmapFileNames[i];
    const appmapData = JSON.parse(await readFile(appmapFileName, 'utf-8'));
    const appmap = buildAppMap().source(appmapData).build();
    const specification = Specification.build(appmap, specOptions);
    const diagram = buildDiagram(appmapFileName, appmap, specification);
    result.set(appmapFileName, diagram);
  }
  return result;
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
  const diffPlantUML = format(FormatType.PlantUML, diagram, `Diagram`);
  const fileNameUML = makeTempFile(`sequence${diffPlantUML.extension}`);
  const fileNameSVG = makeTempFile(`sequence.svg`);
  await writeFile(fileNameUML, diffPlantUML.diagram);
  await executeCommand(`java -jar ${plantumlJar} -tsvg ${fileNameUML}`);
  return fileNameSVG;
}

async function reportDiagram(
  appmapName: string,
  reportLines: string[],
  outputDir: string,
  message: string,
  diagramFile: string | undefined,
  rl: readline.Interface,
  plantumlJar: any,
  diagram: Diagram
): Promise<void> {
  if (outputDir && (await confirm(`Include in the change report?`, rl))) {
    if (!diagramFile) diagramFile = await renderDiagram(plantumlJar, diagram);
    await mkdir(join(outputDir, 'sequence-diagrams'), { recursive: true });
    const fileDirName = dirname(appmapName);
    const fileBaseName = basename(appmapName, '.appmap.json');
    const metadata = JSON.parse(
      await readFile(join(fileDirName, fileBaseName, `metadata.json`), 'utf-8')
    );
    const sourceLocation = metadata.source_location;
    await rename(diagramFile, join(outputDir, 'sequence-diagrams', `${fileBaseName}.svg`));
    reportLines.push(`## [${fileBaseName}](./sequence-diagrams/${fileBaseName}.svg) ${message}.`);
    reportLines.push('');
    reportLines.push(`[${sourceLocation}](../${sourceLocation})`);
    reportLines.push('');
    reportLines.push(`![${fileBaseName}](./sequence-diagrams/${fileBaseName}.svg)`);
    reportLines.push('');
  }
}
