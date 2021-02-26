#! /usr/bin/env node
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable max-classes-per-file */

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const fsp = require('fs').promises;
const { join: joinPath } = require('path');
const { createHash } = require('crypto');
const oboe = require('oboe');
const yaml = require('js-yaml');
const { createReadStream, readFile, writeFile } = require('fs');
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
          return;
        }

        if (file.endsWith('.appmap.json')) {
          fn(path);
        }
      })
  );
}

class FingerprintCommand {
  constructor(directory) {
    this.directory = directory;
  }

  async execute() {
    if (verbose) {
      console.info(`Fingerprinting appmaps in ${this.dir}`);
    }

    await this.files(this.fingerprint.bind(this));
  }

  // eslint-disable-next-line class-methods-use-this
  fingerprint(file) {
    readFile(file, async (err, data) => {
      if (err) {
        console.log(err);
        return;
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
        fingerprints.push({
          appmap_digest: appmapDigest,
          canonicalization_algorithm: algorithmName,
          digest: fingerprintDigest,
          fingerprint_algorithm: 'sha256',
        });
      });

      writeFile(file, JSON.stringify(appmapData, null, 2), (writeErr) => {
        if (writeErr) {
          throw new Error(writeErr.message);
        }
      });
    });
  }

  files(fn) {
    listAppMapFiles(this.directory, fn);
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

  async added() {
    // eslint-disable-next-line no-underscore-dangle
    await this._loadCatalogs();

    return new Set(
      [...this.workingAppMapNames].filter((x) => !this.baseAppMapNames.has(x))
    );
  }

  async removed() {
    // eslint-disable-next-line no-underscore-dangle
    await this._loadCatalogs();

    return new Set(
      [...this.baseAppMapNames].filter((x) => !this.workingAppMapNames.has(x))
    );
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
      console.log(
        yaml.dump({
          added: [...(await diff.added())].sort(),
          removed: [...(await diff.removed())].sort(),
        })
      );
      /*
      console.log(
        `Added AppMaps: ${JSON.stringify([...(await diff.added())].sort())}`
      );
      console.log(
        `Removed AppMaps: ${JSON.stringify([...(await diff.removed())].sort())}`
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
