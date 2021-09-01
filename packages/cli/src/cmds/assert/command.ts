import process from 'process';
import { verbose } from '../../utils';
import ValidationError from '../error/validationError';
import AbortError from '../error/abortError';
import * as fs from 'fs';
import 'fs/promises';
import * as console from 'console';
import { buildAppMap } from '../../search/utils';
import AssertionChecker from './assertionChecker';
import Assertion from './assertion';
import ProgressFormatter from './formatter/progressFormatter';
import PrettyFormatter from './formatter/prettyFormatter';
import { glob as globCallback } from 'glob';
import { promisify } from 'util';
import { AssertionFailure } from './types';

export default {
  command: 'assert',
  describe: 'Run assertions for AppMaps in the directory',

  builder(args) {
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

  handler(argv) {
    verbose(argv.verbose);

    const commandFn = async () => {
      const { appmapDir, config, format } = argv;

      if (!fs.existsSync(appmapDir)) {
        throw new ValidationError(
          `AppMaps directory ${appmapDir} does not exist.`
        );
      }

      let summary = { passed: 0, failed: 0, skipped: 0 };
      const checker = new AssertionChecker();
      const formatter =
        format === 'progress' ? new ProgressFormatter() : new PrettyFormatter();
      const assertionsFn = (await import(config)).default;
      const assertions: Assertion[] = assertionsFn();

      const glob = promisify(globCallback);
      const files: string[] = await glob(`${appmapDir}/**/*.appmap.json`);

      let index = 0;
      const failures: AssertionFailure[] = [];

      files.forEach((file: string) => {
        const appMap = buildAppMap()
          .source(JSON.parse(fs.readFileSync(file, 'utf-8').toString()))
          .normalize()
          .build();

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
      });

      console.log('\n');
      if (failures.length > 0) {
        console.log(`${failures.length} failures:`);
        console.log();

        let failureCount = 0;
        failures.forEach((failure) => {
          failureCount += 1;
          console.log(`Failure ${failureCount}:`);
          console.log(`\tAppMap:\t${failure.appMapName}`);
          console.log(
            `\tEvent:\t${failure.event.id} - ${failure.event.toString()} (${
              failure.event.elapsedTime * 1000
            }ms)`
          );
          console.log(`\tCondition:\t${failure.condition}`);
          console.log('\n');
        });
      }
      process.stdout.write(
        formatter.summary(summary.passed, summary.skipped, summary.failed)
      );
      console.log();

      return process.exit(summary.failed === 0 ? 0 : 1);
    };

    return commandFn().catch((err) => {
      if (err instanceof ValidationError) {
        console.warn(err.message);
        return process.exit(1);
      }
      if (err instanceof AbortError) {
        return process.exit(2);
      }

      throw err;
    });
  },
};
