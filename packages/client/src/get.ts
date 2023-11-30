import { IncomingMessage } from 'http';

import buildRequest from './buildRequest';
import handleError from './handleError';

export default async function get(requestPath: string): Promise<IncomingMessage> {
  const request = buildRequest(requestPath);
  return new Promise<IncomingMessage>((resolve, reject) => {
    request
      .requestFunction(
        request.url,
        {
          headers: request.headers,
        },
        resolve
      )
      .on('error', reject)
      .end();
  }).then(handleError);
}
