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


exports.command = 'assert <appMapsDir>';
exports.describe = 'Run assertions for AppMaps in the directory';

exports.builder = (args) => {
  args.positional('appMapsDir', {
    describe: 'Path to AppMaps directory',
    require: true,
  });
  args.option('config', {
    describe: 'Path to assertions config file',
    default: 'assertions.yml',
    alias: 'c',
  });
  return args.strict();
};

exports.handler = async (argv) => {
  verbose(argv.verbose);

  const commandFn = async () => {
    const { appMapsDir } = argv;

    if (!fs.existsSync(appMapsDir)) {
      throw new ValidationError(`AppMaps directory ${appMapsDir} does not exist.`)
    }

    let summary = { passed: 0, failed: 0 }
    const checker = new AssertionChecker();
    const assertions = [
      new Assertion('http_server_response', '', 'e.elapsed < 1'),
    ];

    fs.readdirSync(appMapsDir).forEach((file: string) => {
      const filePath = appMapsDir + '/' + file;
      const appMap = buildAppMap()
        .source(JSON.parse(fs.readFileSync(filePath, 'utf-8').toString()))
        .normalize()
        .build();

      assertions.forEach((assertion: Assertion) => {
        if (checker.check(appMap, assertion)) {
          summary.passed++;
        } else {
          summary.failed++;
        }
      })
    })

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
