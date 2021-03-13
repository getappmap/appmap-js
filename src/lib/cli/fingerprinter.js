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
      await fsp.writeFile(`${name}.tmp`, contents);
      await fsp.rename(`${name}.tmp`, name);
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
    await writeFile(
      `${baseName(file)}.metadata.json`,
      JSON.stringify(appmap.metadata, null, 2)
    );
    await writeFile(
      `${baseName(file)}.classMap.json`,
      JSON.stringify(appmap.classMap, null, 2)
    );
  }
}

module.exports = Fingerprinter;
