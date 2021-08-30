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
import { glob } from 'glob';
import ProgressFormatter from './formatter/progressFormatter';
import PrettyFormatter from './formatter/prettyFormatter';

exports.command = 'assert';
exports.describe = 'Run assertions for AppMaps in the directory';

exports.builder = (args) => {
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
};

exports.handler = async (argv) => {
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

    const files: string[] = await new Promise((resolve, reject) => {
      glob(`${appmapDir}/**/*.appmap.json`, (err, globFiles) => {
        if (err) {
          return reject(err);
        }
        return resolve(globFiles);
      });
    });

    let index = 0;

    files.forEach((file: string) => {
      const appMap = buildAppMap()
        .source(JSON.parse(fs.readFileSync(file, 'utf-8').toString()))
        .normalize()
        .build();

      process.stdout.write(formatter.appMap(appMap));

      assertions.forEach((assertion: Assertion) => {
        index++;
        const result = checker.check(appMap, assertion);

        if (result === true) {
          summary.passed++;
        } else if (result === false) {
          summary.failed++;
        } else {
          summary.skipped++;
        }

        process.stdout.write(formatter.result(assertion, result, index));
      });
    });

    process.stdout.write('\n\n');
    process.stdout.write(
      formatter.summary(summary.passed, summary.skipped, summary.failed)
    );

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
};
