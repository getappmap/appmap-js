#!/usr/bin/env node

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
const { join: joinPath } = require('path');
const { createHash } = require('crypto');
const {
  algorithms,
  canonicalize,
  buildAppMap,
} = require('../dist/appmap.node');

let verbose = false;

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
    fs.readFile(file, (err, data) => {
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

      fs.writeFile(file, JSON.stringify(appmapData, null, 2), (writeErr) => {
        if (writeErr) {
          throw new Error(writeErr.message);
        }
      });
    });
  }

  async files(fn) {
    FingerprintCommand.listFiles(this.directory, fn);
  }

  static listFiles(directory, fn) {
    if (verbose) {
      console.log(`Scanning ${directory} for AppMaps`);
    }
    fs.readdir(directory, (err, files) => {
      if (err) {
        console.warn(err);
        return;
      }
      files
        .filter((file) => file !== '.' && file !== '..')
        .forEach((file) => {
          const path = joinPath(directory, file);
          fs.stat(path, (statErr, stat) => {
            if (statErr) {
              console.warn(statErr);
              return;
            }
            if (stat.isDirectory()) {
              FingerprintCommand.listFiles(path, fn);
              return;
            }

            if (file.endsWith('.appmap.json')) {
              fn(path);
            }
          });
        });
    });
  }
}

// eslint-disable-next-line no-unused-expressions
yargs(hideBin(process.argv))
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
