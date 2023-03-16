import { exec } from 'child_process';
import { basename, dirname, join, resolve } from 'path';
import yargs from 'yargs';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { exists, verbose } from '../../utils';
import PackageConfig from '../../../package.json';
import { readFile, stat, unlink, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { promisify } from 'util';
import FingerprintDirectoryCommand from '../../fingerprint/fingerprintDirectoryCommand';
import {
  buildDiagram,
  format,
  FormatType,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';
import { queue } from 'async';
import { AppMapFilter, buildAppMap, Filter } from '@appland/models';
import { DefaultMaxAppMapSizeInMB } from '../../lib/fileSizeFilter';
import loadAppMapConfig from '../../lib/loadAppMapConfig';
import { VERSION as IndexVersion } from '../../fingerprint/fingerprinter';
import chalk from 'chalk';
import gitRevision from './gitRevision';
import { Metadata } from './Metadata';

const ArchiveVersion = '1.0';
const { name: ApplandAppMapPackageName, version: ApplandAppMapPackageVersion } = PackageConfig;

/**
 * Default filters for each language - plus a set of default filters that apply to all languages.
 */
export const DefaultFilters = {
  default: ['label:unstable', 'label:serialize', 'label:deserialize.safe', 'label:log'],
  ruby: ['label:mvc.template.resolver', 'package:ruby', 'package:activesupport'],
  python: [],
  java: [],
  javascript: [],
};

export const command = 'archive';
export const describe = 'Build an AppMap archive from a directory containing AppMaps';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('type', {
    describe: 'archive type',
    choices: ['full', 'incremental', 'auto'],
    default: 'auto',
    alias: 't',
  });

  args.option('revision', {
    describe: `revision identifier.
    
If not explicitly specified, the current git revision will be used.
When this command is used in an CI server, it's best to explicitly the provide the revision
from an environment variable provided by the CI system, such as GITHUB_HEAD_SHA, because the
commit of the current git revision may not be the one that triggered the build.`,
    type: 'string',
    alias: 'r',
  });

  args.option('output-dir', {
    describe: 'directory in which to save the output file',
    type: 'string',
  });

  args.option('output-file', {
    describe: 'output file name',
    type: 'string',
    default: 'appmap_archive.tar',
    alias: 'f',
  });

  args.option('concurrency', {
    describe: 'number of AppMap which will be processed in parallel',
    type: 'number',
    default: 5,
  });

  args.option('max-size', {
    describe: 'maximum AppMap size that will be processed, in filesystem-reported MB',
    default: DefaultMaxAppMapSizeInMB,
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  handleWorkingDirectory(argv.directory);
  const workingDirectory = process.cwd();

  const appmapConfig = await loadAppMapConfig();
  if (!appmapConfig) throw new Error(`Unable to load appmap.yml config file`);

  const appMapDir = await locateAppMapDir();

  const {
    concurrency,
    maxSize,
    type,
    revision: defaultRevision,
    outputFile: outputFileName,
  } = argv;
  const { outputDir } = argv || '.';

  const maxAppMapSizeInBytes = Math.round(parseFloat(maxSize) * 1024 * 1024);

  console.log(`Building '${type}' archive from ${appMapDir}`);

  const revision = await gitRevision(defaultRevision);

  console.log(`Building archive of revision ${revision}`);
  const versions = { archive: ArchiveVersion, index: IndexVersion };
  versions[ApplandAppMapPackageName] = ApplandAppMapPackageVersion;

  process.chdir(appMapDir);

  process.stdout.write(`Indexing AppMaps...`);
  const numIndexed = await new FingerprintDirectoryCommand('.').execute();
  process.stdout.write(`done (${numIndexed})\n`);

  console.log('Generating sequence diagrams');

  const specOptions = {
    loops: true,
  } as SequenceDiagramOptions;

  const filter = new AppMapFilter();
  filter.declutter.hideMediaRequests.on = true;
  filter.declutter.limitRootEvents.on = true;

  const preflightConfig = appmapConfig.preflight;

  const defaultFilterGroups = (): string[] => {
    const result = ['default'];
    if (appmapConfig.language) result.push(appmapConfig.language);
    return result;
  };

  const configuredFilterGroups = (): string[] | undefined => {
    if (!preflightConfig?.filter) return;

    return preflightConfig?.filter?.groups;
  };

  const filterGroups = configuredFilterGroups() || defaultFilterGroups();
  const filterGroupNames = filterGroups.map((group) => DefaultFilters[group]).flat();
  const filterNames = preflightConfig?.filter?.names || [];

  if (filterGroupNames.length > 0 || filterNames.length > 0) {
    filter.declutter.hideName.on = true;
    filter.declutter.hideName.names = [...new Set([...filterGroupNames, ...filterNames])].sort();
  }

  const oversizedAppMaps = new Array<string>();
  const sequenceDiagramQueue = queue(async (appmapFileName: string) => {
    // Determine size of file appmapFileName in bytes
    const stats = await stat(appmapFileName);
    if (stats.size > maxAppMapSizeInBytes) {
      console.log(
        `Skipping, and removing, ${appmapFileName} because its size of ${stats.size} exceeds the maximum size of ${maxSize} MB`
      );
      oversizedAppMaps.push(appmapFileName);
      await unlink(appmapFileName);
      return;
    }

    const fullAppMap = buildAppMap()
      .source(await readFile(appmapFileName, 'utf8'))
      .build();
    const filteredAppMap = filter.filter(fullAppMap, []);
    const specification = Specification.build(filteredAppMap, specOptions);
    const diagram = buildDiagram(appmapFileName, filteredAppMap, specification);
    const diagramOutput = format(FormatType.JSON, diagram, appmapFileName);
    const indexDir = join(dirname(appmapFileName), basename(appmapFileName, '.appmap.json'));
    const diagramFileName = join(indexDir, 'sequence.json');
    await writeFile(diagramFileName, diagramOutput.diagram);
  }, concurrency);

  (await promisify(glob)('**/*.appmap.json')).forEach((appmapFileName) =>
    sequenceDiagramQueue.push(appmapFileName)
  );
  await sequenceDiagramQueue.drain();

  const metadata: Metadata = {
    versions,
    workingDirectory,
    appMapDir,
    commandArguments: argv,
    revision,
    timestamp: Date.now().toString(),
    oversizedAppMaps,
    config: appmapConfig,
  };

  if (await exists('appmap_archive.json')) {
    const existingMetadata = JSON.parse(await readFile('appmap_archive.json', 'utf8'));
    const { revision: baseRevision } = existingMetadata;
    if (type === 'auto') {
      console.log(
        `The AppMap directory contains appmap_archive.json, so the archive type will be 'incremental'.
The base revision is ${baseRevision}.`
      );
    }
    if (type === 'full') {
      console.warn(
        chalk.yellow(
          `\nThe AppMap directory contains appmap_archive.json, so it looks like the directory contains incremental AppMaps
that build on revision ${baseRevision}. However, you've specified --type=full. You should
remove appmap_archive.json if your intention is to build a full archive. Otherwise, use --type=auto or --type=incremental.\n`
        )
      );
    } else {
      metadata.baseRevision = baseRevision;
    }
  } else {
    if (type === 'auto') {
      console.log(
        `The AppMap directory does not contain appmap_archive.json, so the archive type will be 'full'.`
      );
    } else if (type === 'incremental') {
      throw new Error(
        `AppMap directory does not contain appmap_archive.json, but you've specified --type=incremental.
The base revision cannot be determined, so either use --type=auto or --type=full.`
      );
    }
  }

  await new Promise<void>((resolveCB, rejectCB) => {
    exec(
      `tar czf appmaps.tar.gz --exclude appmaps.tar.gz --exclude appmap_archive.json *`,
      (error) => {
        if (error) return rejectCB(error);

        resolveCB();
      }
    );
  });

  process.on('exit', () => unlink('appmaps.tar.gz'));

  await writeFile('appmap_archive.json', JSON.stringify(metadata, null, 2));

  await new Promise<void>((resolveCB, rejectCB) => {
    exec(
      `tar cf ${join(
        resolve(workingDirectory, outputDir),
        outputFileName
      )} appmap_archive.json appmaps.tar.gz`,
      (error) => {
        if (error) return rejectCB(error);

        resolveCB();
      }
    );
  });
  console.log(`Created AppMap archive ${join(outputDir, outputFileName)}`);
};
