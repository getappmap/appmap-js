import { buildAppMap } from '@appland/models';
import { glob as globCallback } from 'glob';
import { promisify } from 'util';
import { promises as fs, constants as fsConstants, PathLike } from 'fs';
import AssertionChecker from './assertionChecker';
import ProgressFormatter from './formatter/progressFormatter';
import PrettyFormatter from './formatter/prettyFormatter';
import { ValidationError, AbortError } from './errors';
import { AssertionPrototype, Finding } from './types';
import { Argv, Arguments } from 'yargs';
import chalk from 'chalk';
import loadConfiguration from './configuration';
import { verbose } from './scanner/util';
import { join } from 'path';
import postCommitStatus from './commitStatus/github/commitStatus';
import Generator, { ReportFormat } from './report/generator';

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
  reportFormat: ReportFormat;
  reportFile?: string;
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
      default: join(__dirname, './sampleConfig/default.yml'),
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
    args.option('report-format', {
      describe: 'reporting format',
      default: 'text',
      options: ['text', 'json'],
    });
    args.option('report-file', {
      describe: 'file name for findings report',
    });

    return args.strict();
  },

  async handler(options: Arguments): Promise<void> {
    const {
      appmapDir,
      appmapFile,
      config,
      progressFormat,
      verbose: isVerbose,
      ide,
      commitStatus,
      reportFormat,
      reportFile,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

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
      const assertionPrototypes = await loadConfiguration(config);

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

          process.stderr.write(formatter.appMap(appMap));

          assertionPrototypes.forEach((assertionPrototype: AssertionPrototype) => {
            index++;
            const matchCount = findings.length;
            checker.check(appMap, assertionPrototype, findings);
            const newMatches = findings.slice(matchCount, findings.length);
            newMatches.forEach((match) => (match.appMapFile = file));

            const message = formatter.result(assertionPrototype, newMatches, index);
            if (message) {
              process.stderr.write(message);
            }
          });
        })
      );

      const reportGenerator = new Generator(formatter, reportFormat, reportFile, ide);
      reportGenerator.generate(findings, files.length * assertionPrototypes.length);

      if (commitStatus) {
        return findings.length === 0
          ? await postCommitStatus(
              'success',
              `${files.length * assertionPrototypes.length} checks passed`
            )
          : await postCommitStatus('failure', `${findings.length} findings`);
      }

      return process.exit(findings.length === 0 ? 0 : ExitCode.Finding);
    } catch (err) {
      if (commitStatus) {
        try {
          await postCommitStatus('error', 'There was an error while running AppMap scanner');
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
