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

class FingerprintCommand {
  constructor(directory) {
    this.directory = directory;
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

    Object.keys(algorithms).forEach((algorithmName) => {
      const canonicalForm = canonicalize(algorithmName, appmap);
      const canonicalJSON = JSON.stringify(canonicalForm, null, 2);
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
    });

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
            scenariosByName[node.name] = entry;
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
   * Gets the names of all AppMaps which are added in the working set.
   */
  async added() {
    await this._loadCatalogs();

    return new Set(
      [...this.workingAppMapNames].filter((x) => !this.baseAppMapNames.has(x))
    );
  }

  /**
   * Gets the names of all AppMaps which are present in the base set but not present
   * in the working set.
   */
  async removed() {
    await this._loadCatalogs();

    return new Set(
      [...this.baseAppMapNames].filter((x) => !this.workingAppMapNames.has(x))
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
      .forEach((name) => {
        const base = this.baseCatalog[name];
        const working = this.workingCatalog[name];
        if (!base.metadata.fingerprints || !working.metadata.fingerprints) {
          console.warn('No metadata.fingerprints found on AppMap');
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
          console.warn(`No ${algorithmName} fingerprint found on AppMap`);
          return;
        }

        if (baseFingerprint.digest !== workingFingerprint.digest) {
          result.push(name);
        }
      });
    return result;
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

    this.workingAppMapNames = new Set(Object.keys(this.workingCatalog));
    this.baseAppMapNames = new Set(Object.keys(this.baseCatalog));
  }
}

// eslint-disable-next-line no-unused-expressions
yargs(hideBin(process.argv))
  .command(
    'diff [base-dir] [working-dir]',
    'Perform software design diff',
    (args) => {
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
      let changeLevel = null;
      let changeResult = null;
      const levels = ['error', 'info', 'debug'];
      for (let i = 0; i < levels.length; i += 1) {
        const list = await diff.changed(`beta_v1_${levels[i]}`);
        if (list.length > 0) {
          changeLevel = levels[i];
          changeResult = list;
          break;
        }
      }
      const diffObject = {
        added: [...(await diff.added())].sort(),
      };
      if (changeLevel) {
        diffObject.changed = {};
        diffObject.changed[changeLevel] = changeResult;
      }
      diffObject.removed = [...(await diff.removed())].sort();

      console.log(yaml.dump(diffObject));
      /*
      console.log(
        `Added AppMaps: ${ JSON.stringify([...(await diff.added())].sort()) }`
      );
      console.log(
        `Removed AppMaps: ${ JSON.stringify([...(await diff.removed())].sort()) }`
      );
      */
    }
  )
  .command(
    'fingerprint [directory]',
    'Compute and apply fingerprints for all appmaps in a directory',
    (args) => {
      args.positional('directory', {
        describe: 'directory to recursively process',
        default: 'tmp/appmap',
      });
    },
    (argv) => {
      verbose = argv.verbose;

      new FingerprintCommand(argv.directory).execute();
    }
  )
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  })
  .demandCommand()
  .help().argv;
