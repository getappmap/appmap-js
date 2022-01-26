import { glob as globCallback } from 'glob';
import { writeFile } from 'fs/promises';
import { promisify } from 'util';
import { Arguments, Argv } from 'yargs';

import { FindingStatusListItem } from '@appland/client/dist/src';

import { parseConfigFile } from '../../configuration/configurationProvider';
import { AbortError, ValidationError } from '../../errors';
import { ScanResults } from '../../report/scanResults';
import { verbose } from '../../rules/lib/util';
import { newFindings } from '../../findings';
import findingsReport from '../../report/findingsReport';
import summaryReport from '../../report/summaryReport';

import { ExitCode } from '../exitCode';
import validateFile from '../validateFile';

import CommandOptions from './options';
import { default as buildScanner } from './scanner';
import scanArgs from '../scanArgs';
import { Metadata } from '@appland/models';
import { AppMapMetadata } from 'src/report/scanSummary';

export default {
  command: 'scan',
  describe: 'Scan AppMaps for code behavior findings',
  builder(args: Argv): Argv {
    scanArgs(args);

    args.option('appmap-file', {
      describe: 'single file to scan',
      alias: 'f',
    });
    args.option('ide', {
      describe: 'choose your IDE protocol to open AppMaps directly in your IDE.',
      options: ['vscode', 'x-mine', 'idea', 'pycharm'],
    });
    args.option('all', {
      describe: 'report all findings, including duplicates of known findings',
      default: false,
      type: 'boolean',
    });

    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    const {
      appmapDir,
      appmapFile,
      config,
      verbose: isVerbose,
      all: reportAllFindings,
      app: appIdArg,
      apiKey,
      ide,
      reportFile,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    if (apiKey) {
      process.env.APPLAND_API_KEY = apiKey;
    }

    try {
      if (appmapFile && appmapDir) {
        throw new ValidationError('Use --appmap-dir or --appmap-file, but not both');
      }
      if (!appmapFile && !appmapDir) {
        throw new ValidationError('Either --appmap-dir or --appmap-file is required');
      }

      let files: string[] = [];
      if (appmapDir) {
        await validateFile('directory', appmapDir!);
        const glob = promisify(globCallback);
        files = await glob(`${appmapDir}/**/*.appmap.json`);
      }
      if (appmapFile) {
        await validateFile('file', appmapFile);
        files = [appmapFile];
      }

      const configData = await parseConfigFile(config);

      const scanner = buildScanner(reportAllFindings, configData, files);

      const [rawScanResults, findingStatuses] = await Promise.all<
        ScanResults,
        FindingStatusListItem[]
      >([scanner.scan(), scanner.fetchFindingStatus(appIdArg, appmapDir)]);

      // Always report the raw data
      await writeFile(reportFile, formatReport(rawScanResults));

      let scanResults;
      if (reportAllFindings) {
        scanResults = rawScanResults;
      } else {
        scanResults = rawScanResults.withFindings(
          newFindings(rawScanResults.findings, findingStatuses)
        );
      }

      findingsReport(scanResults.findings, scanResults.appMapMetadata, ide);
      console.log();
      summaryReport(scanResults, true);
      console.log('\n');
    } catch (err) {
      if (err instanceof ValidationError) {
        console.warn(err.message);
        return process.exit(ExitCode.ValidationError);
      }
      if (err instanceof AbortError) {
        return process.exit(ExitCode.AbortError);
      }
      if (!verbose && err instanceof Error) {
        console.error(err.message);
        return process.exit(ExitCode.RuntimeError);
      }

      throw err;
    }
  },
};

function metadataFilter({
  apps: { length: apps },
  clients: { length: clients },
  frameworks: { length: frameworks },
  git: { length: git },
  languages: { length: languages },
  recorders: { length: recorders },
}: AppMapMetadata) {
  const filtered = Object.entries({
    app: apps < 2,
    client: clients < 2,
    git: git < 2,
    language: languages < 2,
    recorder: recorders < 2,
  })
    .filter(([, v]) => v)
    .map(([k]) => k);

  return function (metadata: Metadata): Partial<Metadata> {
    return Object.fromEntries(
      Object.entries(metadata).filter(([k, v]) => {
        if (filtered.includes(k)) return false;
        if (k === 'frameworks') return ((v || []) as never[]).length !== frameworks;
        return true;
      })
    );
  };
}

function uniq<T, K>(entries: Iterable<T>, key: (x: T) => K): Iterable<T> {
  const result = new Map<K, T>();

  for (const entry of entries) {
    const k = key(entry);
    if (result.has(k)) continue;
    result.set(k, entry);
  }

  return result.values();
}

// Formats a report to JSON. Does some data deduplication.
function formatReport(rawScanResults: ScanResults): string {
  const { summary, appMapMetadata, findings } = { ...rawScanResults };

  // remove metadata that's common between appmaps
  const filter = metadataFilter(summary.appMapMetadata);
  const metadata = Object.fromEntries(
    Object.entries(appMapMetadata).map(([id, metadata]) => [id, filter(metadata)])
  );

  // only keep one finding of the same hash
  const uniqueFindings = [...uniq(findings, ({ hash }) => hash)];

  return JSON.stringify(
    {
      ...rawScanResults,
      summary: { ...summary, numFindings: uniqueFindings.length },
      appMapMetadata: metadata,
      findings: uniqueFindings,
    },
    null,
    2
  );
}
