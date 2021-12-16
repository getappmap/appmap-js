import { IncomingMessage } from 'node:http';
import { URL } from 'node:url';
import { Metadata } from '@appland/models';
import Settings from './settings';
import buildRequest from './buildRequest';
import validateSettings from './validateSettings';
import handleError from './handleError';
import reportJson from './reportJson';

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
  const call = (): Promise<IncomingMessage> => {
    return new Promise((resolve, reject) => {
      const request = buildRequest();
      const listAppMapsURL = new URL(
        [Settings.baseURL, 'api/appmaps'].join('/')
      );
      listAppMapsURL.searchParams.append('mapsets[]', mapset.toString());
      request
        .requestFunction(
          listAppMapsURL,
          {
            headers: request.headers,
          },
          resolve
        )
        .on('error', reject)
        .end();
    });
  };

  return validateSettings()
    .then(call)
    .then(handleError)
    .then((response) => reportJson<AppMapListItem[]>(response));
}
