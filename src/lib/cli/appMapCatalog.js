const fsp = require('fs').promises;
const { baseName, listAppMapFiles } = require('./utils');

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
    // eslint-disable-next-line prefer-arrow-callback
    appMapFiles.map(async (file) => {
      const data = await fsp.readFile(`${baseName(file)}.metadata.json`);
      const metadata = JSON.parse(data);
      const entry = {
        fileName: file,
        metadata,
      };
      if (scenariosByName[metadata.name]) {
        console.warn(
          `AppMap name ${metadata.name} is not unique in the mapset`
        );
      } else {
        scenariosByName[metadata.name] = entry;
      }
    })
  );

  return scenariosByName;
}

module.exports = appMapCatalog;
