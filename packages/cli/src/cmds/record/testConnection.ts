import { request as httpsRequest } from 'https';
import { IncomingMessage, request as httpRequest, RequestOptions } from 'http';
import UI from '../userInteraction';
import configureConnection from './configureConnection';
import { RemoteRecordingStatus } from './types';

const HTTP = {
  'http:': httpRequest,
  'https:': httpsRequest,
};

export default async function testConnection(requestOptions: RequestOptions) {
  const retryConnection = async () => {
    const { reconfigure } = await UI.prompt({
      type: 'confirm',
      name: 'reconfigure',
      message: 'Do you want to change any of the server connection parameters?',
    });
    if (reconfigure) {
      await configureConnection(requestOptions);
    }
    await testConnection(requestOptions);
  };

  UI.status = `Performing a test connection to the app`;

  const remoteRecordingStatus = async (): Promise<RemoteRecordingStatus> => {
    const options = Object.assign({}, requestOptions, {
      path: `${requestOptions.path}_appmap/record`,
      method: 'GET',
    });

    const requestFn = HTTP[requestOptions.protocol!];
    return new Promise((resolve, reject) => {
      const req = requestFn(options, (res: IncomingMessage) => {
        if (res.statusCode !== 200) {
          return reject(`HTTP status code ${res.statusCode}`);
        }

        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      });

      req.on('error', (e: Error) => {
        reject(e.message);
      });

      // Write data to request body
      req.end();
    });
  };

  let status: RemoteRecordingStatus | null = null;
  while (!status) {
    try {
      status = await remoteRecordingStatus();
      UI.success(`Great! I am able to connect to the AppMap agent.`);
    } catch (e) {
      UI.error(
        `Uh-oh. I can't connect to the AppMap agent there. The error I got is:\n\n${e}\n`
      );
      await retryConnection();
    }
  }
}
