import { IncomingMessage } from 'node:http';
import { URL } from 'node:url';
import { AppMap } from '@appland/models';
import Settings from './settings';
import reportJSON from './reportJson';
import validateSettings from './validateSettings';
import handleError from './handleError';
import buildRequest from './buildRequest';

/**
 * Loads AppMap data from UUID.
 */
export default class {
  constructor(public uuid: string) {}

  get(): Promise<AppMap> {
    const call = (): Promise<IncomingMessage> => {
      return new Promise((resolve, reject) => {
        const request = buildRequest();
        const getScenarioURL = new URL(
          [Settings.baseURL, 'api/appmaps', this.uuid].join('/')
        );
        request
          .requestFunction(
            getScenarioURL,
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
      .then((response) => reportJSON<AppMap>(response));
  }
}
