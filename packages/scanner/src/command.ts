import { buildAppMap } from '@appland/models';
import { glob as globCallback } from 'glob';
import { promisify } from 'util';
import { promises as fs, constants as fsConstants, PathLike } from 'fs';
import AssertionChecker from './assertionChecker';
import Assertion from './assertion';
import ProgressFormatter from './formatter/progressFormatter';
import PrettyFormatter from './formatter/prettyFormatter';
import { ValidationError, AbortError } from './errors';
import { Finding } from './types';
import { Argv, Arguments } from 'yargs';
import chalk from 'chalk';
import loadConfiguration from './configuration';
import { appMapDir } from './scanner/util';
import { join } from 'path';
import { ideLink } from './scanner/util';
import postCommitStatus from './commitStatus/github/commitStatus';

enum ExitCode {
  ValidationError = 1,
  AbortError = 2,
  RuntimeError = 3,
  Finding = 10,
}

interface CommandOptions {
  verbose?: boolean;
  appmapDir?: string;
  appmapFile?: string;
  config: string;
  progressFormat: string;
  ide?: string;
  commitStatus?: string;
}

export default {
  command: '$0',
  describe: 'Run assertions for AppMaps in the directory',

  builder(args: Argv): Argv {
    args.options('verbose', {
      describe: 'Show verbose output',
      alias: 'v',
    });
    args.option('appmap-dir', {
      describe: 'directory to recursively inspect for AppMaps',
      alias: 'd',
    });
    args.option('appmap-file', {
      describe: 'single file to scan',
      alias: 'f',
    });
    args.option('config', {
      describe:
        'path to assertions config file (TypeScript or YAML, check docs for configuration format)',
      default: join(__dirname, './sampleConfig/default.ts'),
      alias: 'c',
    });
    args.option('progress-format', {
      describe: 'progress output format',
      default: 'progress',
      options: ['progress', 'pretty'],
    });
    args.option('ide', {
      describe: 'choose your IDE protocol to open AppMaps directly in your IDE.',
      options: ['vscode', 'x-mine', 'idea', 'pycharm'],
    });
    args.option('commit-status', {
      describe: 'set your repository hosting system to post commit status',
      options: ['github'],
    });

    return args.strict();
  },

  async handler(options: Arguments): Promise<void> {
    const { appmapDir, appmapFile, config, progressFormat, verbose, ide, commitStatus } =
      options as unknown as CommandOptions;

    const validateFile = async (kind: string, path: string) => {
      try {
        return fs.access(path as PathLike, fsConstants.R_OK);
      } catch {
        throw new ValidationError(
          `AppMap ${kind} ${chalk.red(path)} does not exist, or is not readable.`
        );
      }
    };

    try {
      if (commitStatus) {
        postCommitStatus('pending', 'Validation is in progress...');
      }

      if (appmapFile && appmapDir) {
        throw new ValidationError('Use --appmap-dir or --appmap-file, but not both');
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

      const checker = new AssertionChecker();
      const formatter =
        progressFormat === 'progress' ? new ProgressFormatter() : new PrettyFormatter();
      const assertions = await loadConfiguration(config);
      if (!assertions) {
        throw new Error(`Failed to load assertions from ${chalk.red(config)}`);
      }

      let index = 0;
      const findings: Finding[] = [];

      await Promise.all(
        files.map(async (file: string) => {
          // TODO: Improve this by respecting .gitignore, or similar.
          // For now, this addresses the main problem of encountering appmap-js and its appmap.json files
          // in a bundled node_modules.
          if (file.split('/').includes('node_modules')) {
            return null;
          }
          const appMapData = await fs.readFile(file, 'utf8');
          const appMap = buildAppMap(appMapData).normalize().build();

          process.stdout.write(formatter.appMap(appMap));

          assertions.forEach((assertion: Assertion) => {
            index++;
            const matchCount = findings.length;
            checker.check(appMap, assertion, findings);
            const newMatches = findings.slice(matchCount, findings.length);
            newMatches.forEach((match) => (match.appMapFile = file));

            const message = formatter.result(assertion, newMatches, index);
            if (message) {
              process.stdout.write(message);
            }
          });
        })
      );

      console.log('\n');
      const titledSummary = new Map<string, number>();

      if (findings.length > 0) {
        console.log(`${findings.length} findings:`);
        console.log();

        findings.forEach((match) => {
          titledSummary.set(match.scannerTitle, (titledSummary.get(match.scannerTitle) ?? 0) + 1);

          console.log(`${chalk.magenta(match.message || match.condition)}`);
          const filePath =
            ide && match.appMapFile
              ? ideLink(match.appMapFile, ide, match.event.id)
              : match.appMapFile;
          console.log(`\tLink:\t${chalk.blue(filePath)}`);
          console.log(`\tRule:\t${match.scannerId}`);
          console.log(`\tAppMap name:\t${match.appMapName}`);
          let eventMsg = `\tEvent:\t${match.event.id} - ${match.event.toString()}`;
          if (match.event.elapsedTime !== undefined) {
            eventMsg += ` (${match.event.elapsedTime}s)`;
          }
          console.log(eventMsg);
          console.log('\n');
        });
      }
      process.stdout.write(
        formatter.summary(files.length * assertions.length, findings.length, titledSummary)
      );
      console.log();

      const appMapDirMatches: Record<string, Finding[]> = {};
      findings.forEach((m) => {
        const dirName = appMapDir(m.appMapFile!);
        if (!appMapDirMatches[dirName]) {
          appMapDirMatches[dirName] = [];
        }
        appMapDirMatches[dirName].push(m);
      });

      await Promise.all(
        Object.keys(appMapDirMatches).map(async (appMapDir) => {
          const matches = appMapDirMatches[appMapDir];
          const matchList = matches.map((match) => ({
            eventId: match.event.id,
            scannerId: match.scannerId,
          }));
          return fs.writeFile(join(appMapDir, 'scan.json'), JSON.stringify(matchList, null, 2));
        })
      );

      if (commitStatus) {
        summary.matched === 0
          ? postCommitStatus('success', `${summary.unmatched} checks passed`)
          : postCommitStatus('failure', `${summary.matched} checks failed`);
      }

      return process.exit(findings.length === 0 ? 0 : ExitCode.Finding);
    } catch (err) {
      if (commitStatus) {
        try {
          postCommitStatus('error', 'There was an error while running AppMap scanner');
        } catch (err) {
          console.warn('Unable to post commit status');
        }
      }

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
