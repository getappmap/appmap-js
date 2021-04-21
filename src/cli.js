#! /usr/bin/env node
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable max-classes-per-file */

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const chokidar = require('chokidar');
const { diffLines } = require('diff');
const yaml = require('js-yaml');
const { promises: fsp, readFileSync } = require('fs');
const { queue } = require('async');
const process = require('process');
const readline = require('readline');
const { join } = require('path');
const { algorithms, canonicalize } = require('../dist/appmap.node');
const { verbose, listAppMapFiles, loadAppMap } = require('./lib/cli/utils');
const appMapCatalog = require('./lib/cli/appMapCatalog');
const FingerprintQueue = require('./lib/cli/fingerprintQueue');
const Depends = require('./lib/cli/depends');

class FingerprintDirectoryCommand {
  constructor(directory) {
    this.directory = directory;
    this.print = false;
  }

  setPrint(print) {
    this.print = print;
    return this;
  }

  async execute() {
    if (verbose()) {
      console.warn(`Fingerprinting appmaps in ${this.directory}`);
    }

    const fpQueue = new FingerprintQueue();
    await this.files(fpQueue.push.bind(fpQueue));
    await fpQueue.process();
  }

  async files(fn) {
    return listAppMapFiles(this.directory, fn);
  }
}

class FingerprintWatchCommand {
  constructor(directory) {
    this.directory = directory;
    this.print = false;
    this.numProcessed = 0;
  }

  setPrint(print) {
    this.print = print;
    return this;
  }

  execute() {
    if (verbose()) {
      console.warn(`Watching appmaps in ${this.directory}`);
    }

    this.fpQueue = new FingerprintQueue();
    this.fpQueue.setCounterFn(() => {
      this.numProcessed += 1;
    });
    this.fpQueue.process();
    const watcher = chokidar.watch(`${this.directory}/**/*.appmap.json`, {
      ignoreInitial: true,
    });
    watcher
      .on('add', this.added.bind(this))
      .on('change', this.changed.bind(this))
      .on('unlink', this.removed.bind(this));
  }

  added(file) {
    if (verbose()) {
      console.warn(`AppMap added: ${file}`);
    }
    this.enqueue(file);
  }

  changed(file) {
    if (verbose()) {
      console.warn(`AppMap changed: ${file}`);
    }
    this.enqueue(file);
  }

  // eslint-disable-next-line class-methods-use-this
  removed(file) {
    console.warn(`TODO: AppMap removed: ${file}`);
  }

  enqueue(file) {
    // This shouldn't be necessary, but it's passing through the wrong file names.
    if (!file.includes('.appmap.json')) {
      return;
    }
    this.fpQueue.push(file);
  }
}

class DiffCommand {
  baseDir(dir) {
    this.baseDir = dir;
    return this;
  }

  workingDir(dir) {
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

    return [...this.workingAppMapNames].filter(
      (x) => !this.baseAppMapNames.has(x)
    );
  }

  /**
   * Gets the names of all AppMaps which are present in the base set but not present
   * in the working set.
   */
  async removed() {
    await this._loadCatalogs();

    return [...this.baseAppMapNames].filter(
      (x) => !this.workingAppMapNames.has(x)
    );
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

    const result = [];
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
          (fingerprint) =>
            fingerprint.canonicalization_algorithm === algorithmName
        );
        const workingFingerprint = working.metadata.fingerprints.find(
          (fingerprint) =>
            fingerprint.canonicalization_algorithm === algorithmName
        );
        if (!baseFingerprint || !workingFingerprint) {
          console.warn(
            `No ${algorithmName} fingerprint found on AppMap ${name}`
          );
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
yargs(hideBin(process.argv))
  .command(
    'diff',
    'Compute the difference between two mapsets',
    (args) => {
      args.option('name', {
        describe: 'indicate a specific AppMap to of compare',
      });
      args.option('show-diff', {
        describe:
          'compute the diff of the canonicalized forms of each changed AppMap',
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

      let baseDir;
      let workingDir;
      const { showDiff } = argv;

      // eslint-disable-next-line prefer-const
      baseDir = argv.baseDir;
      // eslint-disable-next-line prefer-const
      workingDir = argv.workingDir;

      if (!baseDir) {
        throw new Error('Location of base version AppMaps is required');
      }
      if (!workingDir) {
        throw new Error('Location of work-in-progress AppMaps is required');
      }

      const diff = new DiffCommand().baseDir(baseDir).workingDir(workingDir);
      if (argv.name) {
        diff.setAppMapNames([argv.name]);
      }

      const diffObject = {
        added: [...(await diff.added())].sort(),
        changed: [],
      };

      const cumulativeChangedAppMaps = new Set();
      const changed = await Promise.all(
        Object.keys(algorithms)
          .map(function (algorithm) {
            return async function () {
              const rawList = await diff.changed(algorithm);
              const changedAppMaps = rawList.filter(
                (name) => !cumulativeChangedAppMaps.has(name)
              );
              changedAppMaps.forEach((name) =>
                cumulativeChangedAppMaps.add(name)
              );
              const changeResult = {
                algorithm,
                changed: [],
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
      args.positional('files', {
        describe: 'provide an explicit list of dependency files',
      });
      args.option('appmap-dir', {
        describe: 'directory to recursively inspect for AppMaps',
        default: 'tmp/appmap',
      });
      args.option('base-dir', {
        describe: 'directory to prepend to each dependency source file',
        default: '.',
      });
      args.option('field', {
        describe: 'print a field from each matching AppMap',
      });
      args.option('stdin-files', {
        describe:
          'read the list of changed files from stdin, one file per line',
        boolean: true,
      });
      return args.strict();
    },
    async (argv) => {
      verbose(argv.verbose);

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
        console.warn(`Testing AppMaps in ${argv.appmapDir}`);
      }

      const depends = new Depends(argv.appmapDir);
      if (argv.baseDir) {
        depends.baseDir = argv.baseDir;
      }
      if (files) {
        depends.files = files;
      }

      const appMapNames = await depends.depends();
      const values = [];
      if (argv.field) {
        const { field } = argv;
        // eslint-disable-next-line no-inner-declarations
        async function printField(appMapBaseName) {
          const data = await fsp.readFile(
            join(appMapBaseName, 'metadata.json')
          );
          const metadata = JSON.parse(data);
          const value = metadata[field];
          if (value) {
            values.push(value);
          } else {
            console.warn(`No ${field} in ${appMapBaseName}`);
          }
        }
        const q = queue(printField, 5);
        appMapNames.forEach((name) => q.push(name));
        await q.drain();
      } else {
        appMapNames.forEach((name) => values.push(name));
      }
      console.log([...new Set(values)].sort().join('\n'));
    }
  )
  .command(
    'index',
    'Compute fingerprints and update index files for all appmaps in a directory',
    (args) => {
      args.option('print', {
        describe: 'print the canonicalized forms of the AppMap',
        boolean: true,
      });
      args.option('watch', {
        describe: 'watch the directory for changes to appmaps',
        boolean: true,
      });
      args.option('appmap-dir', {
        describe: 'directory to recursively inspect for AppMaps',
        default: 'tmp/appmap',
      });
      return args.strict();
    },
    (argv) => {
      verbose(argv.verbose);

      if (argv.watch) {
        const cmd = new FingerprintWatchCommand(argv.appmapDir);
        cmd.setPrint(argv.print).execute();

        // eslint-disable-next-line no-inner-declarations
        function printStatus() {
          process.stdout.write('\x1B[?25l');
          const consoleLabel = 'AppMaps processed: 0';
          process.stdout.write(consoleLabel);
          setInterval(() => {
            readline.cursorTo(process.stdout, consoleLabel.length - 1);
            process.stdout.write(`${cmd.numProcessed}`);
          }, 200);

          process.on('beforeExit', (/* _code */) => {
            process.stdout.write(`\x1B[?25h`);
          });
        }

        if (!argv.verbose) {
          printStatus();
        }
      } else {
        new FingerprintDirectoryCommand(argv.appmapDir)
          .setPrint(argv.print)
          .execute();
      }
    }
  )
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  })
  .strict()
  .demandCommand()
  .help().argv;
