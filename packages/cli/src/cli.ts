#! /usr/bin/env node
/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable max-classes-per-file */

const yargs = require('yargs');
const { diffLines } = require('diff');
const yaml = require('js-yaml');
const { promises: fsp, readFileSync } = require('fs');
const { queue } = require('async');
const readline = require('readline');
const { join } = require('path');
const { algorithms, canonicalize } = require('./fingerprint');
const { verbose, loadAppMap } = require('./utils');
const appMapCatalog = require('./appMapCatalog');
const FingerprintDirectoryCommand = require('./fingerprint/fingerprintDirectoryCommand');
const FingerprintWatchCommand = require('./fingerprint/fingerprintWatchCommand').default;
const Depends = require('./depends');
import { default as OpenAPICommand } from './cmds/openapi';
const InventoryCommand = require('./inventoryCommand');
const OpenCommand = require('./cmds/open/open');
const InspectCommand = require('./cmds/inspect/inspect');
const SequenceDiagramCommand = require('./cmds/sequenceDiagram');
const SequenceDiagramDiffCommand = require('./cmds/sequenceDiagramDiff');
import RecordCommand from './cmds/record/record';
import InstallCommand from './cmds/agentInstaller/install-agent';
import StatusCommand from './cmds/agentInstaller/status';
const StatsCommand = require('./cmds/stats/stats');
import PruneCommand from './cmds/prune/prune';
import { handleWorkingDirectory } from './lib/handleWorkingDirectory';
import { locateAppMapDir } from './lib/locateAppMapDir';

class DiffCommand {
  public appMapNames: any;
  public baseDir?: string;
  public baseAppMapNames: any;
  public baseCatalog: any;
  public workingAppMapNames: any;
  public workingCatalog: any;
  public workingDir?: string;

  setBaseDir(dir) {
    this.baseDir = dir;
    return this;
  }

  setWorkingDir(dir) {
    this.workingDir = dir;
    return this;
  }

  /**
   * Limits the diff computation to a specific AppMaps.
   *
   * @param {string[]} names
   */
  setAppMapNames(names) {
    this.appMapNames = new Set(names);
    return this;
  }

  /**
   * Gets the names of all AppMaps which are added in the working set.
   */
  async added() {
    await this._loadCatalogs();

    return [...this.workingAppMapNames].filter((x) => !this.baseAppMapNames.has(x));
  }

  /**
   * Gets the names of all AppMaps which are present in the base set but not present
   * in the working set.
   */
  async removed() {
    await this._loadCatalogs();

    return [...this.baseAppMapNames].filter((x) => !this.workingAppMapNames.has(x));
  }

  /**
   * Gets the names of all AppMaps which have present in both sets, but whose fingerprints
   * have changed.
   *
   * @param {string} algorithmName Name of the canonicalization algorithm to use for the
   * comparison.
   */
  async changed(algorithmName) {
    await this._loadCatalogs();

    const result: string[] = [];
    Object.keys(this.workingCatalog)
      .filter((name) => this.baseCatalog[name])
      .filter(this._includesAppMap.bind(this))
      .forEach((name) => {
        const base = this.baseCatalog[name];
        const working = this.workingCatalog[name];
        if (!base.metadata.fingerprints || !working.metadata.fingerprints) {
          console.warn(`No metadata.fingerprints found on AppMap ${name}`);
          return;
        }

        const baseFingerprint = base.metadata.fingerprints.find(
          (fingerprint) => fingerprint.canonicalization_algorithm === algorithmName
        );
        const workingFingerprint = working.metadata.fingerprints.find(
          (fingerprint) => fingerprint.canonicalization_algorithm === algorithmName
        );
        if (!baseFingerprint || !workingFingerprint) {
          console.warn(`No ${algorithmName} fingerprint found on AppMap ${name}`);
          return;
        }

        if (baseFingerprint.digest !== workingFingerprint.digest) {
          result.push(name);
        }
      });
    return result;
  }

  _includesAppMap(name) {
    return !this.appMapNames || this.appMapNames.has(name);
  }

  // eslint-disable-next-line no-underscore-dangle
  async _loadCatalogs() {
    if (!this.workingDir) {
      throw new Error('Working directory must be specified');
    }
    // TODO: Other modes of loading the base data, such as from a remote server, can be supported
    // in the future.
    if (!this.baseDir) {
      throw new Error('Base directory must be specified');
    }

    this.workingCatalog = await appMapCatalog(this.workingDir);
    this.baseCatalog = await appMapCatalog(this.baseDir);

    this.workingAppMapNames = new Set(
      Object.keys(this.workingCatalog).filter(this._includesAppMap.bind(this))
    );
    this.baseAppMapNames = new Set(
      Object.keys(this.baseCatalog).filter(this._includesAppMap.bind(this))
    );
  }
}

class DetailedDiff {
  protected algorithm: string;
  protected baseAppMap: any;
  protected workingAppMap: any;

  constructor(algorithm, baseAppMap, workingAppMap) {
    this.algorithm = algorithm;
    this.baseAppMap = baseAppMap;
    this.workingAppMap = workingAppMap;
  }

  async diff() {
    const canonicalizeAppMap = (appmap) => {
      const canonicalForm = canonicalize(this.algorithm, appmap);
      return yaml.dump(canonicalForm);
    };
    const baseDoc = canonicalizeAppMap(this.baseAppMap);
    const workingDoc = canonicalizeAppMap(this.workingAppMap);
    return diffLines(baseDoc, workingDoc);
  }
}

// eslint-disable-next-line no-unused-expressions
yargs(process.argv.slice(2))
  .command(
    'diff',
    'Compute the difference between two mapsets',
    (args) => {
      args.option('directory', {
        describe: 'program working directory',
        type: 'string',
        alias: 'd',
      });
      args.option('name', {
        describe: 'indicate a specific AppMap to compare',
      });
      args.option('show-diff', {
        describe: 'compute the diff of the canonicalized forms of each changed AppMap',
        boolean: true,
      });
      args.option('base-dir', {
        describe: 'directory containing base version AppMaps',
      });
      args.option('working-dir', {
        describe: 'directory containing work-in-progress AppMaps',
      });
    },
    async function (argv) {
      verbose(argv.verbose);
      handleWorkingDirectory(argv.directory);

      let { baseDir, workingDir } = argv;
      const { showDiff } = argv;

      if (!baseDir) {
        throw new Error('Location of base version AppMaps is required');
      }
      if (!workingDir) {
        throw new Error('Location of work-in-progress AppMaps is required');
      }

      const diff = new DiffCommand().setBaseDir(baseDir).setWorkingDir(workingDir);

      if (argv.name) {
        diff.setAppMapNames([argv.name]);
      }

      const diffObject = {
        added: [...(await diff.added())].sort(),
        changed: <any[]>[],
        removed: <any>undefined,
      };

      const cumulativeChangedAppMaps = new Set();
      const changed = await Promise.all(
        Object.keys(algorithms)
          .map(function (algorithm) {
            return async function () {
              const rawList = await diff.changed(algorithm);
              const changedAppMaps = rawList.filter((name) => !cumulativeChangedAppMaps.has(name));
              changedAppMaps.forEach((name) => cumulativeChangedAppMaps.add(name));
              const changeResult = {
                algorithm,
                changed: <any[]>[],
              };
              if (changedAppMaps.length > 0) {
                if (showDiff) {
                  changeResult.changed = await Promise.all(
                    changedAppMaps.map(
                      // eslint-disable-next-line prettier/prettier
                      async function (name) {
                        return {
                          name,
                          diff: await new DetailedDiff(
                            algorithm,
                            await loadAppMap(diff.baseCatalog[name].fileName),
                            await loadAppMap(diff.workingCatalog[name].fileName)
                          ).diff(),
                        };
                      }
                    )
                  );
                } else {
                  changeResult.changed = changedAppMaps.map((name) => ({
                    name,
                  }));
                }
              }
              return changeResult;
            };
          })
          .map((func) => func())
      );
      diffObject.changed = changed;
      diffObject.removed = [...(await diff.removed())].sort();

      console.log(yaml.dump(diffObject));
    }
  )
  .command(
    'depends [files]',
    'Compute a list of AppMaps that are out of date',
    (args) => {
      args.option('directory', {
        describe: 'program working directory',
        type: 'string',
        alias: 'd',
      });
      args.positional('files', {
        describe: 'provide an explicit list of dependency files',
      });
      args.option('appmap-dir', {
        describe: 'directory to recursively inspect for AppMaps',
      });
      args.option('base-dir', {
        describe: 'directory to prepend to each dependency source file',
        default: '.',
      });
      args.option('field', {
        describe: 'print a field from each matching AppMap',
      });
      args.option('stdin-files', {
        describe: 'read the list of changed files from stdin, one file per line',
        boolean: true,
      });
      return args.strict();
    },
    async (argv) => {
      verbose(argv.verbose);
      handleWorkingDirectory(argv.directory);
      const appmapDir = await locateAppMapDir(argv.appmapDir);

      let { files } = argv;
      if (argv.stdinFiles) {
        const stdinFileStr = readFileSync(0).toString();
        const stdinFiles = stdinFileStr.split('\n');
        files = (files || []).concat(stdinFiles);
        if (verbose()) {
          console.warn(`Computing depends on ${files.join(', ')}`);
        }
      }

      if (verbose()) {
        console.warn(`Testing AppMaps in ${appmapDir}`);
      }

      const depends = new Depends(appmapDir);
      if (argv.baseDir) {
        depends.baseDir = argv.baseDir;
      }
      if (files) {
        depends.files = files;
      }

      const appMapNames = await depends.depends();
      const values: any[] = [];
      if (argv.field) {
        const { field } = argv;
        const q = queue(async (appMapBaseName: string) => {
          const data = await fsp.readFile(join(appMapBaseName, 'metadata.json'));
          const metadata = JSON.parse(data);
          const value = metadata[field];
          if (value) {
            const tokens = value.split(':');
            values.push(tokens[0]);
          } else {
            console.warn(`No ${field} in ${appMapBaseName}`);
          }
        }, 5);
        appMapNames.forEach((name) => q.push(name));
        await q.drain();
      } else {
        appMapNames.forEach((name) => values.push(name));
      }
      console.log(Array.from(new Set(values)).sort().join('\n'));
    }
  )
  .command(
    'index',
    'Compute fingerprints and update index files for all appmaps in a directory',
    (args) => {
      args.option('directory', {
        describe: 'program working directory',
        type: 'string',
        alias: 'd',
      });
      args.option('watch', {
        describe: 'watch the directory for changes to appmaps',
        boolean: true,
      });
      args.option('appmap-dir', {
        describe: 'directory to recursively inspect for AppMaps',
      });
      return args.strict();
    },
    async (argv) => {
      verbose(argv.verbose);
      handleWorkingDirectory(argv.directory);
      const appmapDir = await locateAppMapDir(argv.appmapDir);

      if (argv.watch) {
        const cmd = new FingerprintWatchCommand(appmapDir);
        await cmd.execute();

        if (!argv.verbose && process.stdout.isTTY) {
          process.stdout.write('\x1B[?25l');
          const consoleLabel = 'AppMaps processed: 0';
          process.stdout.write(consoleLabel);
          setInterval(() => {
            readline.cursorTo(process.stdout, consoleLabel.length - 1);
            process.stdout.write(`${cmd.numProcessed}`);
          }, 1000);

          process.on('beforeExit', (/* _code */) => {
            process.stdout.write(`\x1B[?25h`);
          });
        }
      } else {
        const cmd = new FingerprintDirectoryCommand(appmapDir);
        await cmd.execute();
      }
    }
  )
  .command(
    'inventory',
    'Generate canonical lists of the application code object inventory',
    (args) => {
      args.option('directory', {
        describe: 'program working directory',
        type: 'string',
        alias: 'd',
      });
      args.option('appmap-dir', {
        describe: 'directory to recursively inspect for AppMaps',
      });
      return args.strict();
    },
    async (argv) => {
      verbose(argv.verbose);
      handleWorkingDirectory(argv.directory);
      const appmapDir = await locateAppMapDir(argv.appmapDir);

      await new FingerprintDirectoryCommand(appmapDir).execute();

      const inventory = await new InventoryCommand(appmapDir).execute();
      console.log(yaml.dump(inventory));
    }
  )
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  })
  .fail((msg, err, yargs) => {
    if (msg) {
      console.log(yargs.help());
      console.log(msg);
    } else if (err) {
      if (err.cause) {
        console.error(err.message);
        console.error(err.cause);
      } else {
        console.error(err);
      }
    }
    process.exit(1);
  })
  .command(OpenAPICommand)
  .command(InstallCommand)
  .command(OpenCommand)
  .command(RecordCommand)
  .command(StatusCommand)
  .command(StatsCommand)
  .command(InspectCommand)
  .command(SequenceDiagramCommand)
  .command(SequenceDiagramDiffCommand)
  .command(PruneCommand)
  .strict()
  .demandCommand()
  .help().argv;
