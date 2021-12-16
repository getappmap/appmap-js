import { IncomingMessage } from 'node:http';
import Settings from './settings';
import { FindingStatusListItem } from './types';
import { URL } from 'node:url';
import buildRequest from './buildRequest';
import validateSettings from './validateSettings';
import handleError from './handleError';
import reportJson from './reportJson';

/**
 * Lists known Findings for an app.
 */
export default function listFindingStatus(
  app: string
): Promise<FindingStatusListItem[]> {
  const call = (): Promise<IncomingMessage> => {
    return new Promise((resolve, reject) => {
      const request = buildRequest();
      const listFindingStatusURL = new URL(
        [Settings.baseURL, 'api', app, 'finding_status'].join('/')
      );
      request
        .requestFunction(
          listFindingStatusURL,
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
    .then((response) => reportJson<FindingStatusListItem[]>(response));
}
