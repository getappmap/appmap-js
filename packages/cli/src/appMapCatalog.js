const fsp = require('fs').promises;
const { baseName, findFiles } = require('./utils');

/**
 * appMapCatalog creates a lookup table of all the AppMap metadata in a directory (recursively).
 *
 * @param {string} directory path to the directory.
 * @returns {Object<String,Metadata>} Map of AppMap names to metadata objects.
 */
async function appMapCatalog(directory) {
  const appMapsByName = {};
  const appMapFiles = await findFiles(directory, '.appmap.json');

  await Promise.all(
    // eslint-disable-next-line prefer-arrow-callback
    appMapFiles.map(async (file) => {
      const data = await fsp.readFile(`${baseName(file)}.metadata.json`);
      const metadata = JSON.parse(data);
      const entry = {
        fileName: file,
        metadata,
      };
      if (appMapsByName[metadata.name]) {
        console.warn(`AppMap name ${metadata.name} is not unique in the mapset`);
      } else {
        appMapsByName[metadata.name] = entry;
      }
    })
  );

  return appMapsByName;
}

module.exports = appMapCatalog;
