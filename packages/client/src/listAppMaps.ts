import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { URL } from 'node:url';
import { Metadata } from '@appland/models';
import Settings from './settings';

export type AppMapListItem = {
  scenario_uuid: string;
  metadata: Metadata;
};

/**
 * Lists AppMaps in a mapset.
 */
export default async function listAppMap(
  mapset: number
): Promise<AppMapListItem[]> {
  if (!Settings.valid) {
    throw new Error(`AppMap client is not configured`);
  }

  return new Promise((resolve, reject) => {
    if (!Settings.apiKey) {
      reject(new Error(`No API key has been provided`));
      return;
    }

    const listAppMapsURL = new URL([Settings.baseURL, 'api/appmaps'].join('/'));
    listAppMapsURL.searchParams.append('mapsets[]', mapset.toString());
    const requestFunction =
      listAppMapsURL.protocol === 'https:' ? httpsRequest : httpRequest;
    const request = requestFunction(
      listAppMapsURL,
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
          resolve(JSON.parse(data) as AppMapListItem[]);
        });
      }
    );

    request.on('error', (e) => {
      reject(e);
    });

    // Write data to request body
    request.end();
  });
}
