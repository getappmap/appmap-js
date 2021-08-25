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

exports.command = 'assert';
exports.describe = 'Run assertions for AppMaps in the directory';

exports.builder = (args) => {
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
    default: 'tmp/appmap',
  });
  args.option('config', {
    describe: 'path to assertions config file',
    default: 'assertions.yml',
    alias: 'c',
  });
  return args.strict();
};

exports.handler = async (argv) => {
  verbose(argv.verbose);

  const commandFn = async () => {
    const { appmapDir } = argv;

    if (!fs.existsSync(appmapDir)) {
      throw new ValidationError(`AppMaps directory ${appmapDir} does not exist.`);
    }

    let summary = { passed: 0, failed: 0, skipped: 0 };
    const checker = new AssertionChecker();
    const assertions = [
      new Assertion('http_server_request','e.elapsed < 1'),
      new Assertion('sql_query', 'e.elapsed < 0.1', 'e.sql.sql.match(/SELECT/)'),
    ];

    const files: string[] = await new Promise((resolve, reject) => {
      glob(`${appmapDir}/**/*.appmap.json`, (err, globFiles) => {
        if (err) {
          return reject(err);
        }
        return resolve(globFiles);
      });
    });

    files.forEach((file: string) => {
      const appMap = buildAppMap()
        .source(JSON.parse(fs.readFileSync(file, 'utf-8').toString()))
        .normalize()
        .build();

      assertions.forEach((assertion: Assertion) => {
        const result = checker.check(appMap, assertion);

        if (result === true) {
          summary.passed++;
        } else if (result === false) {
          summary.failed++;
        } else {
          summary.skipped++;
        }
      })
    });

    console.log(summary);

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
