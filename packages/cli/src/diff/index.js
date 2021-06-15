// @ts-check

/**
 * @param {import('./types').MapsetProvider} baseProvider
 * @param {import('./types').MapsetProvider} headProvider
 * @returns {import('./types').MapsetDiff}
 */
async function diff(baseProvider, headProvider) {
  const baseAppMaps = baseProvider.appMaps();
  const headAppMaps = headProvider.appMaps();

  const baseData = await baseAppMaps[0].loadAppMapData();
}

module.exports = diff;
