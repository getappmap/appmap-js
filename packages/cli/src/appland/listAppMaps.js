const { request: httpRequest } = require('http');
const { request: httpsRequest } = require('https');
const { baseURL, apiKey, exists } = require('./settings');

/** @typedef {import('./types').AppMapListItem} AppMapListItem */

/**
 * Lists AppMaps in a mapset.
 *
 * @param {number} mapset
 * @returns {Promise<AppMapListItem[]>}
 */
const listAppMaps = async (mapset) => {
  if (!exists) {
    throw new Error(`AppMap client is not configured`);
  }

  return new Promise((resolve, reject) => {
    const listAppMapsURL = new URL([baseURL, 'api/appmaps'].join('/'));
    listAppMapsURL.searchParams.append('mapsets[]', mapset.toString());
    const requestFunction =
      listAppMapsURL.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = requestFunction(
      listAppMapsURL,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      },
      // eslint-disable-next-line consistent-return
      (res) => {
        if (res.statusCode >= 300) {
          return reject(res.statusCode);
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      }
    );

    req.on('error', (e) => {
      reject(e);
    });

    // Write data to request body
    req.end();
  });
};

module.exports = listAppMaps;
