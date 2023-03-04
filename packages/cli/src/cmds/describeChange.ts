import { mkdir, rm, writeFile } from 'fs/promises';
import yargs from 'yargs';
import readline from 'readline';
import { OpenAPIV3 } from 'openapi-types';

import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../lib/locateAppMapDir';
import { exists, verbose } from '../utils';
import { isAbsolute, join, relative } from 'path';
import { Action, actionActors, Diagram, format, FormatType } from '@appland/sequence-diagram';
import { glob } from 'glob';
import { promisify } from 'util';
import { DiffDiagrams } from '../sequenceDiagramDiff/DiffDiagrams';
import assert from 'assert';
import chalk from 'chalk';
import { AppMapReference } from '../describeChange/AppMapReference';
import { RevisionName } from '../describeChange/RevisionName';
import { OpenAPICommand } from '../openapi/OpenAPICommand';
import { DefaultMaxAppMapSizeInMB, fileSizeFilter } from '../openapi/fileSizeFilter';
import buildChangeReport from '../describeChange/buildChangeReport';
import { executeCommand } from '../describeChange/executeCommand';
import { OperationReference } from '../describeChange/OperationReference';

export class ValidationError extends Error {}

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

  const { baseCommand, headCommand } = argv;
  let { outputDir } = argv;

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

  if (baseRevision === headRevision) {
    throw new ValidationError(`Base and head revisions are the same: ${baseRevision}`);
  }

  if (!outputDir) {
    outputDir = `revision-report/${sanitizeRevision(baseRevision)}-${sanitizeRevision(
      headRevision
    )}`;
  }

  if (await exists(outputDir)) {
    if (
      argv.clobberOutputDir ||
      !(await confirm(`Use existing data directory ${outputDir}?`, rl))
    ) {
      if (
        !argv.clobberOutputDir &&
        !(await confirm(`Delete existing data directory ${outputDir}?`, rl))
      ) {
        const msg = `The data directory ${outputDir} exists but you don't want to use it or delete it. Aborting...`;
        console.warn(msg);
        yargs.exit(1, new Error(msg));
      }
      await rm(outputDir, { recursive: true, force: true });
      // Rapid rm and then mkdir will silently fail in practice.
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
  }

  // stashAll()

  await mkdir(outputDir, { recursive: true });
  await mkdir(join(outputDir, RevisionName.Diff), { recursive: true });

  const operationReference = new OperationReference(outputDir);
  const appmapReferences = new Map<string, AppMapReference>();
  let baseAppMapFileNames: Set<string>;
  let headAppMapFileNames: Set<string>;

  const processAppMaps = async (
    revisionName: RevisionName,
    revision: string,
    command?: string
  ): Promise<Set<string>> => {
    await mkdir(join(outputDir, revisionName), { recursive: true });
    await mkdir(join(outputDir, revisionName, 'operations', 'sequence-diagrams'), {
      recursive: true,
    });

    await checkout(revisionName, revision);
    await createBaselineAppMaps(rl, command);
    process.stdout.write(`Processing AppMaps in ${appmapDir}...`);
    const result = new Set([
      ...(await processAppMapDir(
        appmapDir,
        outputDir,
        revisionName,
        operationReference,
        appmapReferences
      )),
    ]);
    process.stdout.write(`done (${result.size})\n`);
    return result;
  };

  const restoreAppMaps = async (revisionName: RevisionName): Promise<Set<string>> => {
    process.stdout.write(
      `Loading existing AppMap and diagram data from ${join(outputDir, revisionName)}...`
    );
    const result = new Set([
      ...(await restoreAppMapDir(outputDir, revisionName, operationReference, appmapReferences)),
    ]);
    process.stdout.write(`done (${result.size})\n`);
    return result;
  };

  const processOrRestoreAppMaps = async (
    revisionName: RevisionName,
    revision: string,
    command?: string
  ): Promise<Set<string>> => {
    if (await exists(join(outputDir, revisionName))) {
      // TODO: This is temporary; operation reference indexing is not needed here.
      operationReference.startIndexing();
      const result = await restoreAppMaps(revisionName);
      await operationReference.finishIndexing();
      return result;
    } else {
      operationReference.startIndexing();
      const result = await processAppMaps(revisionName, revision, command);
      await operationReference.finishIndexing();
      return result;
    }
  };

  const buildOpenAPI = async (revisionName: RevisionName): Promise<OpenAPIV3.PathsObject> => {
    const cmd = new OpenAPICommand(AppMapReference.outputPath(outputDir, revisionName));
    cmd.filter = fileSizeFilter(DefaultMaxAppMapSizeInMB * 1024 * 1024);
    const [openapi] = await cmd.execute();
    return openapi.paths;
  };

  baseAppMapFileNames = await processOrRestoreAppMaps(RevisionName.Base, baseRevision, baseCommand);
  headAppMapFileNames = await processOrRestoreAppMaps(RevisionName.Head, headRevision, headCommand);

  const basePaths = await buildOpenAPI(RevisionName.Base);
  const headPaths = await buildOpenAPI(RevisionName.Head);

  // unstashAll()

  const changeReport = await buildChangeReport(
    baseRevision,
    basePaths,
    headPaths,
    baseAppMapFileNames,
    headAppMapFileNames,
    operationReference,
    appmapReferences
  );

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
      await printSourceDiff(baseRevision, appmapReference, rl);
      await reportDiagram(
        RevisionName.Head,
        outputDir,
        baseRevision,
        headRevision,
        appmapReference,
        reportLines
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

    const diffActors = new Set<string>();
    const filterDiffActions = (actions: Action[]): Action[] => {
      const result = actions.filter((action) => diffActions.has(action));
      result.forEach((action) => {
        actionActors(action).forEach((actor) => (actor ? diffActors.add(actor.name) : undefined));
        action.children = filterDiffActions(action.children);
      });
      return result;
    };
    diffDiagram.rootActions = filterDiffActions(diffDiagram.rootActions);
    diffDiagram.actors = diffDiagram.actors.filter((actor) => diffActors.has(actor.name));

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

    const diagramTextLines = diagramText
      .split('\n')
      .filter((line) => !/^\d+ times:$/.test(line.trim()));
    if (diagramTextLines.length === 0) {
      continue;
    }

    await reportDiagram(
      RevisionName.Diff,
      outputDir,
      baseRevision,
      headRevision,
      appmapReference,
      reportLines
    );
  }

  if (outputDir) {
    const report = `<head>
    <title>AppMap code change report</title>
</head>
<body>
  ${reportLines.join('\n')}
</body>`;
    const diagramHTML = `<head>
  Sequence diagram
</head>
<body>
  <div id="app"></div>
  <script src="http://127.0.0.1:5501/packages/cli/built/html/sequenceDiagram.js" defer=""></script>
</body>`;
    const appmapHTML = `<head>
  AppMap
</head>
<body>
  <div id="app"></div>
  <script src="http://127.0.0.1:5501/packages/cli/built/html/appmap.js" defer=""></script>
</body>`;
    await writeFile(join(outputDir, 'report.html'), report);
    await writeFile(join(outputDir, 'diagram.html'), diagramHTML);
    await writeFile(join(outputDir, 'appmap.html'), appmapHTML);
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
    prominentStyle(
      `Generate the AppMaps for this revision in a separate terminal - for example, by running the tests.`
    )
  );
  await waitForEnter(rl, `Press Enter when the AppMaps are ready`);
}

async function checkout(revisionName: string, revision: string): Promise<void> {
  console.log();
  console.log(actionStyle(`Switching to ${revisionName} revision: ${revision}`));
  await executeCommand(`git checkout ${revision}`, true, false, false);
  console.log();
}

async function processAppMapDir(
  appmapDir: string,
  outputDir: string,
  revisionName: RevisionName,
  operationReference: OperationReference,
  appmapReferences: Map<string, AppMapReference>
): Promise<string[]> {
  const appmapFileNames = await promisify(glob)(`${appmapDir}/**/*.appmap.json`);
  for (let i = 0; i < appmapFileNames.length; i++) {
    const appmapFileName = appmapFileNames[i];
    const appmapReference = new AppMapReference(operationReference, outputDir, appmapFileName);
    await appmapReference.processAppMap(revisionName);
    if (!appmapReferences.get(appmapFileName)) {
      appmapReferences.set(appmapFileName, appmapReference);
    }
  }
  return appmapFileNames;
}

async function restoreAppMapDir(
  outputDir: string,
  revisionName: RevisionName,
  operationReference: OperationReference,
  appmapReferences: Map<string, AppMapReference>
): Promise<string[]> {
  const baseDir = join(outputDir, revisionName);
  const appmapFileNames = await promisify(glob)(`${baseDir}/*.appmap.json`);
  for (let i = 0; i < appmapFileNames.length; i++) {
    const appmapFileName = appmapFileNames[i];
    const appmapReference = new AppMapReference(
      operationReference,
      outputDir,
      relative(baseDir, appmapFileName)
    );
    await appmapReference.restoreMetadata(revisionName);
    if (!appmapReferences.get(appmapReference.appmapFileName))
      appmapReferences.set(appmapReference.appmapFileName, appmapReference);
  }
  return appmapFileNames.map((fileName) => relative(baseDir, fileName));
}

async function confirm(prompt: string, rl: readline.Interface): Promise<boolean> {
  let response = '';
  while (!['y', 'n'].includes(response)) {
    response = await ask(rl, `${prompt} (y/n) `);
  }
  return response === 'y';
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
export function commandStyle(message: string): string {
  return chalk.gray(`$ ${message}`);
}
async function waitForEnter(
  rl: readline.Interface,
  prompt = 'Press Enter to continue'
): Promise<void> {
  console.log(prominentStyle(`${prompt}...`));
  await new Promise<void>((resolve) => {
    const listener = () => {
      rl.removeListener('line', listener);
      resolve();
    };
    rl.addListener('line', listener);
  });
}

async function reportDiagram(
  revisionName: RevisionName,
  outputDir: string,
  baseRevision: string,
  headRevision: string,
  appmapReference: AppMapReference,
  reportLines: string[]
): Promise<void> {
  if (true /* await confirm(`Include in the change report?`, rl)) */) {
    const diagramText = await appmapReference.loadSequenceDiagramText(revisionName);

    const appmapName = appmapReference.appmapName || appmapReference.appmapFileName;

    if (revisionName === RevisionName.Head) {
      reportLines.push(
        `<h2>
          <a href="http://127.0.0.1:5500/${outputDir}/appmap.html?appmap=/${appmapReference.archivedAppMapFilePath(
          revisionName,
          true
        )}">${appmapName}</a> is new in ${headRevision}
        </h2>`
      );
    } else {
      assert(
        revisionName === RevisionName.Diff,
        `Expecting revisionName to be '${RevisionName.Diff}', got '${revisionName}'`
      );
      reportLines.push(
        `<h2>
          <a href="http://127.0.0.1:5500/${outputDir}/diagram.html?diagram=/${appmapReference.sequenceDiagramFilePath(
          revisionName,
          'json',
          true
        )}">${appmapName}</a> has changed
        </h2>`
      );
    }

    if (appmapReference.sourceLocation) {
      const sourcePath = appmapReference.sourceLocation.split(':')[0];
      const fileURL = isAbsolute(sourcePath)
        ? relative(outputDir, sourcePath)
        : relative(outputDir, join(process.cwd(), sourcePath));
      reportLines.push('');
      reportLines.push(
        `<a href="${fileURL}">${relative(process.cwd(), appmapReference.sourceLocation)}</a>`
      );
      reportLines.push('');
    }

    const sourceDiff = await appmapReference.sourceDiff(baseRevision);
    if (sourceDiff) {
      reportLines.push('<br/>');
      reportLines.push('<code>');
      reportLines.push('<pre>');
      reportLines.push(sourceDiff);
      reportLines.push('</pre>');
      reportLines.push('</code>');
      reportLines.push('<br/>');
    }

    reportLines.push('<br/>');
    reportLines.push('<br/>');
    reportLines.push('<code>');
    reportLines.push('<pre>');
    reportLines.push(diagramText);
    reportLines.push('</pre>');
    reportLines.push('</code>');
    // reportLines.push('');
    // reportLines.push(
    //   `![${appmapName}](${appmapReference.sequenceDiagramFilePath(revisionName, 'svg', false)})`
    // );
    // reportLines.push('');
  }
}

function sanitizeRevision(revision: string): string {
  return revision.replace(/[^a-zA-Z0-9_]/g, '_');
}

async function printSourceDiff(
  baseRevision: any,
  appmapReference: AppMapReference,
  rl: readline.Interface
): Promise<void> {
  const sourceDiff = await appmapReference.sourceDiff(baseRevision);
  if (sourceDiff) {
    // if (await confirm(`View ${sourceDiff.split('\n').length} line source diff?`, rl)) {
    console.log();
    console.log(sourceDiff);
    console.log();
    // }
  }
}

function printDiagramText(diagramTextLines: string[]): void {
  console.log(`${diagramTextLines.length} line sequence diagram diff:`);
  console.log();
  diagramTextLines.forEach((line) => console.log(line));
  console.log();
}
