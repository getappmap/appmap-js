import { buildAppMap, Metadata } from '@appland/models';
import { glob as globCallback } from 'glob';
import { promisify } from 'util';
import { promises as fs, constants as fsConstants, PathLike } from 'fs';
import ProgressFormatter from './formatter/progressFormatter';
import PrettyFormatter from './formatter/prettyFormatter';
import { ValidationError, AbortError } from './errors';
import { Finding } from './types';
import { Argv, Arguments } from 'yargs';
import chalk from 'chalk';
import { loadConfiguration } from './configuration';
import { verbose } from './rules/util';
import { join } from 'path';
import postCommitStatus from './integration/github/commitStatus';
import postPullRequestComment from './integration/github/postPullRequestComment';
import Generator, { ReportFormat } from './report/generator';
import RuleChecker from './ruleChecker';
import { ScanResults } from './report/scanResults';

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
  pullRequestComment?: string;
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
    args.option('pull-request-comment', {
      describe:
        'set your repository hosting system to post pull request comment with findings summary',
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
      pullRequestComment,
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

      const checker = new RuleChecker();
      const formatter =
        progressFormat === 'progress' ? new ProgressFormatter() : new PrettyFormatter();
      const checks = await loadConfiguration(config);

      const appMapMetadata: Record<string, Metadata> = {};
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
          appMapMetadata[file] = appMap.metadata;

          process.stderr.write(formatter.appMap(appMap));

          await Promise.all(
            checks.map(async (check) => {
              const matchCount = findings.length;
              await checker.check(file, appMap, check, findings);
              const newMatches = findings.slice(matchCount, findings.length);
              newMatches.forEach((match) => (match.appMapFile = file));

              const message = formatter.result(check, newMatches);
              if (message) {
                process.stderr.write(message);
              }
            })
          );
        })
      );

      const reportGenerator = new Generator(formatter, reportFormat, reportFile, ide);

      const scanSummary = new ScanResults(appMapMetadata, findings, checks);
      const summaryText = reportGenerator.generate(scanSummary, findings, appMapMetadata);

      if (pullRequestComment && findings.length > 0) {
        try {
          await postPullRequestComment(summaryText);
        } catch (err) {
          console.warn('Unable to post pull request comment');
        }
      }

      if (commitStatus) {
        return findings.length === 0
          ? await postCommitStatus('success', `${files.length * checks.length} checks passed`)
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
