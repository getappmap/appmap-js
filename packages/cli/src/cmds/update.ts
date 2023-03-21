import chalk from 'chalk';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { dirname, join, relative, resolve } from 'path';
import { promisify } from 'util';
import yargs from 'yargs';
import { Metadata as AppMapMetadata } from '@appland/models';
import Depends from '../depends';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import loadAppMapConfig from '../lib/loadAppMapConfig';
import { locateAppMapDir } from '../lib/locateAppMapDir';
import { exists, verbose } from '../utils';
import gitDeletedFiles from './archive/gitDeletedFiles';
import gitModifiedFiles from './archive/gitModifiedFiles';
import gitNewFiles from './archive/gitNewFiles';
import { Metadata } from './archive/Metadata';
import runTests from './archive/runTests';
import FingerprintDirectoryCommand from '../fingerprint/fingerprintDirectoryCommand';
import gitAncestors from './archive/gitAncestors';
import assert from 'assert';

export const command = 'update';
export const describe = 'Update AppMaps by running new and out-of-date tests';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });

  args.option('base-appmap-dir', {
    describe: 'directory in which base AppMaps are available',
    type: 'string',
    demandOption: true,
  });

  args.option('test-folder', {
    describe: 'folder in which tests are located',
    array: true,
  });

  args.option('test-command', {
    describe: 'command to invoke with the updated (added + modified) tests',
    array: true,
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  const { baseAppmapDir } = argv;

  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir();
  const appmapConfig = await loadAppMapConfig();
  if (!appmapConfig) throw new Error(`Unable to load appmap.yml config file`);

  const testFoldersArgument = (): string[] | undefined => argv.testFolder;
  const testFoldersConfig = (): string[] | undefined => appmapConfig.preflight?.test_folders;

  const testFolders = testFoldersArgument() || testFoldersConfig();
  if (!testFolders)
    console.warn(
      chalk.yellow(`No test folders specified. Use --test-folder arguments, or configure 
test_folders in appmap.yml. In the absence of this information, all added and changed files will
be included in the file arguments passed to the test runner.`)
    );

  const testCommandsArgument = (): Record<string, string> | undefined => {
    const testCommands = argv.testCommand as string[] | undefined;
    if (!testCommands) return;

    return testCommands.reduce((memo, line) => {
      const match = /\[([^\]]+)\]\s+(.*)/.exec(line);
      if (!match) {
        console.warn(chalk.red(`Invalid test command: ${line}`));
      } else {
        const folder = match[1];
        const command = match[2];
        memo[folder] = command;
      }
      return memo;
    }, {});
  };
  const testCommandsConfig = (): Record<string, string> | undefined =>
    appmapConfig.preflight?.test_commands;
  const testCommands = testCommandsArgument() || testCommandsConfig();

  const archiveMetadata = await Promise.all<Metadata>(
    (
      await promisify(glob)(join(baseAppmapDir, 'appmap_archive.*.json'))
    ).map(async (metadataFile) => JSON.parse(await readFile(metadataFile, 'utf8')))
  );

  const archiveRevisions = archiveMetadata.map((metadata) => metadata.revision);
  const repoRevisions = await gitAncestors('HEAD');
  const baseRevision = repoRevisions.find((revision) => archiveRevisions.includes(revision));

  if (!baseRevision) throw new Error(`No AppMap archive found for any ancestor revision.`);

  console.log(`Comparing code changes with revision ${baseRevision}`);

  const baseArchive = archiveMetadata.find((metadata) => metadata.revision === baseRevision);
  assert(baseArchive);

  const addedTestFiles = await gitNewFiles(testFolders);
  const modifiedFiles = await gitModifiedFiles(baseRevision, []);
  const modifiedTestFiles = await gitModifiedFiles(baseRevision, ['d'], testFolders);
  const deletedTestFiles = await gitDeletedFiles(baseRevision, testFolders);
  const outOfDateTestFiles = new Set([...addedTestFiles, ...modifiedTestFiles]);

  console.log(`${outOfDateTestFiles.size} test case files are added or modified.`);

  if (verbose()) {
    if (addedTestFiles.length > 0) console.log(`Added tests: ${addedTestFiles.join(' ')}`);
    if (modifiedTestFiles.length > 0) console.log(`Modified tests: ${modifiedTestFiles.join(' ')}`);
    if (deletedTestFiles.length > 0) console.log(`Deleted tests: ${deletedTestFiles.join(' ')}`);
  }

  const indexAppMaps = async (dir: string) => {
    process.stdout.write(`Indexing AppMaps...`);
    const numIndexed = await new FingerprintDirectoryCommand(dir).execute();
    process.stdout.write(`done (${numIndexed})\n`);
  };

  await indexAppMaps(baseAppmapDir);

  const dirtyTests = new Set([...modifiedTestFiles, ...deletedTestFiles]);
  const deletedAppMaps = new Array<string>();
  // Remove AppMaps for deleted and modified tests
  await Promise.all(
    (
      await promisify(glob)(join(appmapDir, '**/metadata.json'))
    ).map(async (metadataFile) => {
      const metadata = JSON.parse(await readFile(metadataFile, 'utf-8'));
      const { source_location: sourceLocation } = metadata;
      if (!sourceLocation) return;

      const [path] = sourceLocation.split(':');

      if (dirtyTests.has(path)) {
        const appmapName = dirname(metadataFile);
        console.warn(
          `AppMap ${appmapName} is out of date because ${path} has been ${
            modifiedTestFiles.includes(path) ? 'modified' : 'deleted'
          }`
        );
        deletedAppMaps.push(appmapName);
      }
    })
  );

  const depends = new Depends(baseAppmapDir);
  depends.files = modifiedFiles;
  const outOfDateAppMaps = await depends.depends();
  if (outOfDateAppMaps.length > 0) {
    console.log(`${outOfDateAppMaps.length} AppMaps are out of date.`);
    if (verbose()) console.log(`Out-of-date AppMaps: ${outOfDateAppMaps.join(' ')}`);
    for (const appmap of outOfDateAppMaps) {
      const metadata = JSON.parse(
        await readFile(join(appmap, 'metadata.json'), 'utf-8')
      ) as AppMapMetadata;
      if (metadata.source_location) outOfDateTestFiles.add(metadata.source_location.split(':')[0]);
    }
  }

  if (verbose()) {
    if (outOfDateTestFiles.size > 0)
      console.log(`Updated (added+modified) tests: ${[...outOfDateTestFiles].join(' ')}`);
  }

  if (outOfDateTestFiles.size === 0) {
    console.log('No changes detected to the code or tests.');
    return;
  }

  console.log(`${outOfDateTestFiles.size} tests will be re-run.`);

  await mkdir(appmapDir, { recursive: true });

  const testFilesByFolder = new Map<string, string[]>();
  for (const testFile of outOfDateTestFiles) {
    const localPath = relative(process.cwd(), testFile);
    if (!(await exists(testFile))) {
      console.warn(chalk.yellow(`Test file ${testFile} does not exist`));
      continue;
    }
    testFolders?.forEach((folder) => {
      if (localPath.startsWith(folder))
        testFilesByFolder.set(folder, [...(testFilesByFolder.get(folder) || []), localPath]);
    });
  }

  for (const [folder, testFiles] of testFilesByFolder.entries()) {
    const command = testCommands?.[folder];
    if (!command) {
      console.warn(chalk.yellow(`No test command configured for folder ${folder}`));
      continue;
    }
    await runTests(command, testFiles);
  }

  await writeFile(join(appmapDir, 'appmap_archive.json'), JSON.stringify(baseArchive, null, 2));
};
