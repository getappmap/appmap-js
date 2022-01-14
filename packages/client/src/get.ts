import { IncomingMessage } from 'http';

import buildRequest from './buildRequest';
import handleError from './handleError';

export default async function (requestPath: string): Promise<IncomingMessage> {
  const request = await buildRequest(requestPath);
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
