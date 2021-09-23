import { buildAppMap } from '@appland/models';
import { glob as globCallback } from 'glob';
import { promisify } from 'util';
import { promises as fs, constants as fsConstants, PathLike } from 'fs';
import AssertionChecker from './assertionChecker';
import Assertion from './assertion';
import ProgressFormatter from './formatter/progressFormatter';
import PrettyFormatter from './formatter/prettyFormatter';
import { ValidationError, AbortError } from './errors';
import { AssertionMatch } from './types';
import { Argv, Arguments } from 'yargs';
import chalk from 'chalk';
import loadConfiguration from './configuration';
import { exec } from 'child_process';
import { appMapDir } from './scanner/util';
import { join } from 'path';
import { ideLink } from './scanner/util';

interface CommandOptions {
  verbose?: boolean;
  appmapDir: string;
  config: string;
  progressFormat: string;
  ide?: string;
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
      default: 'tmp/appmap',
      alias: 'd',
    });
    args.option('config', {
      describe:
        'path to assertions config file (TypeScript or YAML, check docs for configuration format)',
      default: '../sampleAssertions.js',
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

    return args.strict();
  },

  async handler(options: Arguments): Promise<void> {
    const { appmapDir, config, progressFormat, verbose, ide } =
      options as unknown as CommandOptions;

    process.stdout.write(`Indexing ${appmapDir}...`);
    await new Promise((resolve, reject) => {
      exec(
        `node ./node_modules/@appland/appmap/built/src/cli.js index --appmap-dir ${appmapDir}`,
        (error, stdout /* , stderr */) => {
          if (error) {
            return reject(error);
          }
          resolve(stdout);
        }
      );
    });
    console.log('done');

    try {
      try {
        await fs.access(appmapDir as PathLike, fsConstants.R_OK);
      } catch {
        throw new ValidationError(`AppMaps directory ${chalk.red(appmapDir)} does not exist.`);
      }

      const summary = { matched: 0, unmatched: 0, skipped: 0 };
      const checker = new AssertionChecker();
      const formatter =
        progressFormat === 'progress' ? new ProgressFormatter() : new PrettyFormatter();
      const assertions = await loadConfiguration(config);
      if (!assertions) {
        throw new Error(`Failed to load assertions from ${chalk.red(config)}`);
      }

      const glob = promisify(globCallback);
      const files: string[] = await glob(`${appmapDir}/**/*.appmap.json`);

      let index = 0;
      const matches: AssertionMatch[] = [];

      await Promise.all(
        files.map(async (file: string) => {
          const appMapData = await fs.readFile(file, 'utf8');
          const appMap = buildAppMap(appMapData).normalize().build();

          process.stdout.write(formatter.appMap(appMap));

          assertions.forEach((assertion: Assertion) => {
            index++;
            const matchCount = matches.length;
            checker.check(appMap, assertion, matches);
            const newMatches = matches.slice(matchCount, matches.length);
            newMatches.forEach((match) => (match.appMapFile = file));

            if (newMatches.length === 0) {
              summary.unmatched++;
            } else {
              summary.matched++;
            }

            const message = formatter.result(assertion, newMatches, index);
            if (message) {
              process.stdout.write(message);
            }
          });
        })
      );

      console.log('\n');
      const titledSummary = new Map<string, number>();

      if (matches.length > 0) {
        console.log(`${matches.length} matches:`);
        console.log();

        let matchCount = 0;
        matches.forEach((match) => {
          matchCount += 1;
          titledSummary.set(match.scannerTitle, (titledSummary.get(match.scannerTitle) ?? 0) + 1);

          console.log(`Case ${matchCount}:`);
          console.log(`\tScanner:\t${match.scannerId}`);
          console.log(`\tAppMap:\t${match.appMapName}`);

          const filePath =
            ide && match.appMapFile
              ? ideLink(match.appMapFile, ide, match.event.id)
              : match.appMapFile;
          console.log(`\tFile:\t${filePath}`);

          let eventMsg = `\tEvent:\t${match.event.id} - ${match.event.toString()}`;
          if (match.event.elapsedTime !== undefined) {
            eventMsg += ` (${match.event.elapsedTime}s)`;
          }
          console.log(eventMsg);
          if (match.event.parent) {
            console.log(`\tParent:\t${match.event.parent.id} - ${match.event.parent.toString()}`);
          }
          console.log(`\tCondition:\t${match.condition}`);
          console.log('\n');
        });
      }
      process.stdout.write(
        formatter.summary(summary.unmatched, summary.skipped, summary.matched, titledSummary)
      );
      console.log();

      const appMapDirMatches: Record<string, AssertionMatch[]> = {};
      matches.forEach((m) => {
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

      return process.exit(summary.matched === 0 ? 0 : 1);
    } catch (err) {
      if (err instanceof ValidationError) {
        console.warn(err.message);
        return process.exit(1);
      }
      if (err instanceof AbortError) {
        return process.exit(2);
      }
      if (!verbose && err instanceof Error) {
        console.error(err.message);
        return process.exit(3);
      }

      throw err;
    }
  },
};
