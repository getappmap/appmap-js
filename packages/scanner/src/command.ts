import { buildAppMap } from '@appland/models';
import { glob as globCallback } from 'glob';
import { promisify } from 'util';
import { promises as fs, constants as fsConstants, PathLike } from 'fs';
import AssertionChecker from './assertionChecker';
import Assertion from './assertion';
import ProgressFormatter from './formatter/progressFormatter';
import PrettyFormatter from './formatter/prettyFormatter';
import { ValidationError, AbortError } from './errors';
import { AssertionFailure } from './types';
import { Argv, Arguments } from 'yargs';
import chalk from 'chalk';

interface CommandOptions {
  verbose?: boolean;
  appmapDir: string;
  config: string;
  format: string;
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
    });
    args.option('config', {
      describe:
        'path to assertions config file. The path indicated should default-export a function which returns an Assertion[].',
      default: './defaultAssertions',
      alias: 'c',
    });
    args.option('format', {
      describe: 'output format',
      default: 'progress',
      options: ['progress', 'pretty'],
    });

    return args.strict();
  },

  async handler(options: Arguments): Promise<void> {
    const { appmapDir, config, format, verbose } = options as unknown as CommandOptions;

    try {
      try {
        await fs.access(appmapDir as PathLike, fsConstants.R_OK);
      } catch {
        throw new ValidationError(`AppMaps directory ${chalk.red(appmapDir)} does not exist.`);
      }

      const summary = { passed: 0, failed: 0, skipped: 0 };
      const checker = new AssertionChecker();
      const formatter = format === 'progress' ? new ProgressFormatter() : new PrettyFormatter();
      const assertionsFn = (await import(config)).default;
      const assertions: Assertion[] = assertionsFn();

      const glob = promisify(globCallback);
      const files: string[] = await glob(`${appmapDir}/**/*.appmap.json`);

      let index = 0;
      const failures: AssertionFailure[] = [];

      await Promise.all(
        files.map(async (file: string) => {
          const appMapData = await fs.readFile(file, 'utf8');
          const appMap = buildAppMap(appMapData).normalize().build();

          process.stdout.write(formatter.appMap(appMap));

          assertions.forEach((assertion: Assertion) => {
            index++;
            const failureCount = failures.length;
            checker.check(appMap, assertion, failures);
            const newFailures = failures.slice(failureCount, failures.length);

            if (newFailures.length === 0) {
              summary.passed++;
            } else {
              summary.failed++;
            }

            const message = formatter.result(assertion, newFailures, index);
            if (message) {
              process.stdout.write(message);
            }
          });
        })
      );

      console.log('\n');
      if (failures.length > 0) {
        console.log(`${failures.length} failures:`);
        console.log();

        let failureCount = 0;
        failures.forEach((failure) => {
          failureCount += 1;
          console.log(`Failure ${failureCount}:`);
          console.log(`\tAppMap:\t${failure.appMapName}`);

          let eventMsg = `\tEvent:\t${failure.event.id} - ${failure.event.toString()}`;
          if (failure.event.elapsedTime !== undefined) {
            eventMsg += ` (${failure.event.elapsedTime}ms)`;
          }

          console.log(eventMsg);
          console.log(`\tCondition:\t${failure.condition}`);
          console.log('\n');
        });
      }
      process.stdout.write(formatter.summary(summary.passed, summary.skipped, summary.failed));
      console.log();

      return process.exit(summary.failed === 0 ? 0 : 1);
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
