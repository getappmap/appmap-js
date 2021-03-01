#! /usr/bin/env node
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable max-classes-per-file */

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const fsp = require('fs').promises;
const asyncUtils = require('async');
const { join: joinPath } = require('path');
const { createHash } = require('crypto');
const oboe = require('oboe');
const { diffLines } = require('diff');
const yaml = require('js-yaml');
const { createReadStream } = require('fs');
const {
  algorithms,
  canonicalize,
  buildAppMap,
} = require('../dist/appmap.node');

let verbose = false;

async function listAppMapFiles(directory, fn) {
  if (verbose) {
    console.log(`Scanning ${directory} for AppMaps`);
  }
  const files = await fsp.readdir(directory);
  await Promise.all(
    files
      .filter((file) => file !== '.' && file !== '..')
      // eslint-disable-next-line prefer-arrow-callback
      .map(async function (file) {
        const path = joinPath(directory, file);
        const stat = await fsp.stat(path);
        if (stat.isDirectory()) {
          await listAppMapFiles(path, fn);
        }

        if (file.endsWith('.appmap.json')) {
          await fn(path);
        }

        return null;
      })
  );
}

async function loadAppMap(filePath) {
  return buildAppMap()
    .source(JSON.parse(await fsp.readFile(filePath)))
    .normalize()
    .build();
}

class FingerprintCommand {
  constructor(directory) {
    this.directory = directory;
    this.print = false;
  }

  setPrint(print) {
    this.print = print;
    return this;
  }

  async execute() {
    if (verbose) {
      console.info(`Fingerprinting appmaps in ${this.directory}`);
    }

    // Trying to process all these files at the same time simply runs node out of memory.
    const files = [];
    await this.files((file) => files.push(file));

    asyncUtils.mapLimit(
      files,
      5,
      async function (file) {
        await this.fingerprint(file);
      }.bind(this)
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async fingerprint(file) {
    if (verbose) {
      console.info(`Fingerprinting ${file}`);
    }

    const data = await fsp.readFile(file);
    if (verbose) {
      console.log(`Read ${data.length} bytes`);
    }

    const appmapData = JSON.parse(data.toString());
    const appmapDataWithoutMetadata = JSON.parse(data.toString());
    delete appmapDataWithoutMetadata.metadata;
    const appmapDigest = createHash('sha256')
      .update(JSON.stringify(appmapDataWithoutMetadata, null, 2))
      .digest('hex');

    const fingerprints = [];
    appmapData.metadata.fingerprints = fingerprints;
    const appmap = buildAppMap(appmapData).normalize().build();

    await Promise.all(
      Object.keys(algorithms).map(async (algorithmName) => {
        const canonicalForm = canonicalize(algorithmName, appmap);
        const canonicalJSON = JSON.stringify(canonicalForm, null, 2);

        if (this.print) {
          await fsp.writeFile(`${file}.${algorithmName}`, canonicalJSON);
        }

        const fingerprintDigest = createHash('sha256')
          .update(canonicalJSON)
          .digest('hex');
        if (verbose) {
          console.log(`Computed digest for ${algorithmName}`);
        }
        fingerprints.push({
          appmap_digest: appmapDigest,
          canonicalization_algorithm: algorithmName,
          digest: fingerprintDigest,
          fingerprint_algorithm: 'sha256',
        });
      })
    );

    await fsp.writeFile(`${file}.tmp`, JSON.stringify(appmapData, null, 2));
    await fsp.rename(`${file}.tmp`, file);
  }

  async files(fn) {
    return listAppMapFiles(this.directory, fn);
  }
}

/**
 * appMapCatalog creates a lookup table of all the AppMap metadata in a directory (recursively).
 *
 * @param {string} directory path to the directory.
 * @returns {Object<String,Metadata>} Map of AppMap names to metadata objects.
 */
async function appMapCatalog(directory) {
  const scenariosByName = {};
  const appMapFiles = [];
  await listAppMapFiles(directory, (file) => {
    appMapFiles.push(file);
  });

  await Promise.all(
    appMapFiles.map(function (fileName) {
      return new Promise(function (resolve, reject) {
        const entry = {
          fileName: null,
          metadata: null,
        };

        oboe(createReadStream(fileName))
          .on('node', 'metadata', function (node) {
            if (verbose) {
              console.log(`Loading AppMap ${node.name} into catalog`);
              console.log(node.fingerprints);
            }
            entry.fileName = fileName;
            entry.metadata = node;
            if (scenariosByName[node.name]) {
              console.warn(
                `AppMap name ${node.name} is not unique in the mapset`
              );
            } else {
              scenariosByName[node.name] = entry;
            }
            resolve();
          })
          .fail(reject);
      });
    })
  );

  return scenariosByName;
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
      verbose = argv.verbose;

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
    'fingerprint [directory]',
    'Compute and apply fingerprints for all appmaps in a directory',
    (args) => {
      args.option('print', {
        describe: 'print the canonicalized forms of the AppMap',
        boolean: true,
      });
      args.positional('directory', {
        describe: 'directory to recursively process',
        default: 'tmp/appmap',
      });
    },
    (argv) => {
      verbose = argv.verbose;

      new FingerprintCommand(argv.directory).setPrint(argv.print).execute();
    }
  )
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  })
  .demandCommand()
  .help().argv;
