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

interface CommandOptions {
  verbose?: boolean;
  appmapDir: string;
  config: string;
  progressFormat: string;
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
        'path to assertions config file. The path indicated should default-export a function which returns an Assertion[].',
      default: '../sampleAssertions.yml',
      alias: 'c',
    });
    args.option('progress-format', {
      describe: 'progress output format',
      default: 'progress',
      options: ['progress', 'pretty'],
    });

    return args.strict();
  },

  async handler(options: Arguments): Promise<void> {
    const { appmapDir, config, progressFormat, verbose } = options as unknown as CommandOptions;

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

            if (newMatches.length === 0) {
              summary.matched++;
            } else {
              summary.unmatched++;
            }

            const message = formatter.result(assertion, newMatches, index);
            if (message) {
              process.stdout.write(message);
            }
          });
        })
      );

      console.log('\n');
      if (matches.length > 0) {
        console.log(`${matches.length} matches:`);
        console.log();

        let matchCount = 0;
        matches.forEach((match) => {
          matchCount += 1;
          console.log(`Match ${matchCount}:`);
          console.log(`\tAppMap:\t${match.appMapName}`);

          let eventMsg = `\tEvent:\t${match.event.id} - ${match.event.toString()}`;
          if (match.event.elapsedTime !== undefined) {
            eventMsg += ` (${match.event.elapsedTime}ms)`;
          }
          console.log(eventMsg);
          if (match.event.parent) {
            console.log(`\tParent:\t${match.event.parent.id} - ${match.event.parent.toString()}`);
          }
          console.log(`\tCondition:\t${match.condition}`);
          console.log('\n');
        });
      }
      process.stdout.write(formatter.summary(summary.matched, summary.skipped, summary.unmatched));
      console.log();

      return process.exit(summary.unmatched === 0 ? 0 : 1);
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
