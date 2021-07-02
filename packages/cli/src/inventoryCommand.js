const { join: joinPath } = require('path');
const { promises: fsp } = require('fs');
const { verbose, listAppMapFiles, baseName } = require('./utils');

class InventoryCommand {
  constructor(directory) {
    this.directory = directory;
    this.print = true;
  }

  async execute() {
    if (verbose()) {
      console.warn(`Collecting query info from ${this.directory}`);
    }

    const result = {
      packages: new Set(),
      classes: new Set(),
      labels: new Set(),
      packageDependencies: new Set(),
      sqlTables: new Set(),
      sqlNormalized: new Set(),
      httpServerRequests: new Set(),
      // httpClientRequests: new Set(),
    };

    await this.files(async (appMapFileName) => {
      if (verbose()) {
        console.warn(`Collecting query info from ${appMapFileName}`);
      }
      const indexDir = baseName(appMapFileName);

      await Promise.all(
        Object.keys(result).map(async (algorithmName) => {
          const items = JSON.parse(
            await fsp.readFile(
              joinPath(indexDir, `canonical.${algorithmName}.json`)
            )
          );

          items.forEach((item) =>
            result[algorithmName].add(JSON.stringify(item))
          );
        })
      );
    });

    return Object.keys(result).reduce((memo, key) => {
      memo[key] = [...result[key]].sort().map((i) => JSON.parse(i));
      return memo;
    }, {});
  }

  async files(fn) {
    return listAppMapFiles(this.directory, fn);
  }
}

module.exports = InventoryCommand;
