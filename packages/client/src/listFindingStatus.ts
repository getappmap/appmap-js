import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import Settings from './settings';
import { FindingStatusListItem } from './types';
import { URL } from 'url';

/**
 * Lists known Findings for an app.
 */
const listFindingStatus = async (app: string): Promise<FindingStatusListItem> => {
  if (!Settings.valid) {
    throw new Error(`AppMap client is not configured`);
  }

  return new Promise((resolve, reject) => {
    const listFindingStatusURL = new URL([Settings.baseURL, 'api', app, 'findings'].join('/'));
    const requestFunction = listFindingStatusURL.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = requestFunction(
      listFindingStatusURL,
      {
        headers: {
          Authorization: `Bearer ${Settings.apiKey}`,
          Accept: 'application/json',
        },
      },
      // eslint-disable-next-line consistent-return
      (res) => {
        if (!res.statusCode) {
          return reject('(No status code was provided by the server)');
        }
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

export default listFindingStatus;
