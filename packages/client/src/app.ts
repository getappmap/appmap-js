import { IncomingMessage } from 'node:http';
import { URL } from 'node:url';
import Settings from './settings';
import validateSettings from './validateSettings';
import handleError from './handleError';
import buildRequest from './buildRequest';
import { FindingStatusListItem } from '.';
import reportJson from './reportJson';

export default class {
  constructor(public fqname: string) {}

  listFindingStatus(): Promise<FindingStatusListItem[]> {
    const call = (): Promise<IncomingMessage> => {
      return new Promise((resolve, reject) => {
        const request = buildRequest();
        const listFindingStatusURL = new URL(
          [Settings.baseURL, 'api', this.fqname, 'finding_status'].join('/')
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
}
