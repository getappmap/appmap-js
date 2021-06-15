/* eslint-disable max-classes-per-file */
// @ts-check

const getAppMap = require('../appland/getAppMap');
const listAppMaps = require('../appland/listAppMaps');

/** @typedef {import('./types').AppMapListItem} AppMapListItem */
/** @typedef {import('./types').AppMapData} AppMapData */

class RemoteAppMapListItem {
  /**
   *
   * @param {AppMapListItem} appMapListItem
   */
  constructor(appMapListItem) {
    this.appMapListItem = appMapListItem;
  }

  get name() {
    // @ts-ignore
    return /** @type {string} */ (this.appMapListItem.metadata.name);
  }

  /**
   * @param {string} algorithm
   * @returns {string}
   */
  fingerprint(algorithm) {
    return this.appMapListItem.metadata.fingerprints.find(
      (fingerprint) => fingerprint.canonicalization_algorithm === algorithm
    ).digest;
  }

  /**
   * @returns {Promise<AppMapData>}
   */
  async loadAppMapData() {
    return getAppMap(this.appMapListItem.scenario_uuid);
  }
}

class RemoteMapsetProvider {
  constructor(/** @type {number} */ mapset) {
    this.mapset = mapset;
  }

  async appMaps() {
    return (await listAppMaps(this.mapset)).map(
      (appMapListItem) => new RemoteAppMapListItem(appMapListItem)
    );
  }
}

module.exports = RemoteMapsetProvider;
