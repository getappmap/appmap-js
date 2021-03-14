const { createHash } = require('crypto');
const fsp = require('fs').promises;
const { verbose, baseName } = require('./utils');
const {
  algorithms,
  canonicalize,
  buildAppMap,
} = require('../../../dist/appmap.node');

class Fingerprinter {
  constructor(printCanonicalAppMaps) {
    this.printCanonicalAppMaps = printCanonicalAppMaps;
  }

  // eslint-disable-next-line class-methods-use-this
  async fingerprint(file) {
    if (verbose()) {
      console.info(`Fingerprinting ${file}`);
    }

    const classMapFileName = `${baseName(file)}.classMap.json`;
    const metadataFileName = `${baseName(file)}.metadata.json`;

    const fileStat = await fsp.stat(file, { bigint: true });
    const classMapStat = await fsp.stat(classMapFileName, { bigint: true });
    if (fileStat.mtimeNs <= classMapStat.mtimeNs) {
      if (verbose()) {
        console.log('Fingerprints appear up to date. Skipping...');
        return;
      }
    }

    const data = await fsp.readFile(file);
    if (verbose()) {
      console.log(`Read ${data.length} bytes`);
    }

    const appmapData = JSON.parse(data.toString());
    if (!appmapData.metadata) {
      if (verbose()) {
        console.info(`${file} has no metadata. Skipping...`);
      }
      return;
    }

    const appmapDataWithoutMetadata = JSON.parse(data.toString());
    delete appmapDataWithoutMetadata.metadata;
    const appmapDigest = createHash('sha256')
      .update(JSON.stringify(appmapDataWithoutMetadata, null, 2))
      .digest('hex');

    const fingerprints = [];
    appmapData.metadata.fingerprints = fingerprints;
    const appmap = buildAppMap(appmapData).normalize().build();

    async function writeFile(name, contents) {
      async function renameFile() {
        try {
          await fsp.rename(`${name}.tmp`, name);
          return true;
        } catch (err) {
          if (err.code !== 'ENOENT') {
            throw err;
          }
          return false;
        }
      }

      function delay(t) {
        return new Promise((resolve) => {
          setTimeout(resolve, t);
        });
      }

      await fsp.writeFile(`${name}.tmp`, contents);
      [renameFile, renameFile, renameFile].find(async (fn) => {
        const result = await fn();
        if (!result) {
          await delay(1);
        }
        return result;
      });
    }

    await Promise.all(
      Object.keys(algorithms).map(async (algorithmName) => {
        const canonicalForm = canonicalize(algorithmName, appmap);
        const canonicalJSON = JSON.stringify(canonicalForm, null, 2);

        if (this.printCanonicalAppMaps) {
          await fsp.writeFile(
            `${baseName(file)}.canonical.${algorithmName}.json`,
            canonicalJSON
          );
        }

        const fingerprintDigest = createHash('sha256')
          .update(canonicalJSON)
          .digest('hex');
        if (verbose()) {
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

    await writeFile(file, JSON.stringify(appmapData, null, 2));
    await writeFile(metadataFileName, JSON.stringify(appmap.metadata, null, 2));
    await writeFile(classMapFileName, JSON.stringify(appmap.classMap, null, 2));
  }
}

module.exports = Fingerprinter;
