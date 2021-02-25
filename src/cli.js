<<<<<<< HEAD
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
=======
#! /usr/bin/env npx -p @babel/core -p @babel/node babel-node
/* eslint-disable max-classes-per-file */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createReadStream, readFile, writeFile, promises as fsp } from 'fs';
import { join as joinPath } from 'path';
import { createHash } from 'crypto';
import oboe from 'oboe';
import { algorithms, canonicalize } from './lib/fingerprint/canonicalize';
import appMapBuilder from './lib/models/appMapBuilder';
>>>>>>> 9345d8a... Start adding diff command

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
<<<<<<< HEAD
    fs.readFile(file, (err, data) => {
=======
    readFile(file, async (err, data) => {
>>>>>>> 9345d8a... Start adding diff command
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

class DiffCommand {
  baseDir(dir) {
    this.baseDir = dir;
    return this;
  }

  workingDir(dir) {
    this.workingDir = dir;
    return this;
  }

  async execute() {
    if (!this.workingDir) {
      throw new Error('Working directory must be specified');
    }

    const appMapFiles = [];
    await listAppMapFiles(this.workingDir, (file) => {
      appMapFiles.push(file);
    });

    const scenariosByName = {};
    // eslint-disable-next-line prefer-arrow-callback
    await Promise.all(
      appMapFiles.map(function (fileName) {
        // eslint-disable-next-line prefer-arrow-callback
        return new Promise(function (resolve, reject) {
          oboe(createReadStream(fileName))
            .node({
              // eslint-disable-next-line func-names
              'metadata.name': function (name) {
                console.log(name);
                scenariosByName[name] = fileName;
                this.abort();
                resolve();
              },
            })
            .fail(reject);
        });
      })
    );

    console.log(scenariosByName);

    console.log('TODO: Perform diff');
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
    (argv) => {
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

      new DiffCommand().baseDir(baseDir).workingDir(workingDir).execute();
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
