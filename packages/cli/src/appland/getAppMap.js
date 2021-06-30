// @ts-check

const { request: httpRequest } = require('http');
const { request: httpsRequest } = require('https');
const { baseURL, apiKey, exists } = require('./settings');

/**
 * Loads AppMap data from UUID.
 *
 * @param {string} uuid
 * @returns {Promise<AppMapData>}
 */
const getAppMap = async (uuid) => {
  if (!exists) {
    throw new Error(`AppMap client is not configured`);
  }

  return new Promise((resolve, reject) => {
    const getScenarioURL = new URL([baseURL, 'api/appmaps', uuid].join('/'));
    const requestFunction =
      getScenarioURL.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = requestFunction(
      getScenarioURL,
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

module.exports = getAppMap;
