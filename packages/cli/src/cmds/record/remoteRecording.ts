import { request as httpsRequest } from 'https';
import { IncomingMessage, request as httpRequest, RequestOptions } from 'http';
import { RemoteRecordingStatus } from './types/remoteRecordingStatus';
import { appendFileSync } from 'fs';

const HTTP = {
  'http:': httpRequest,
  'https:': httpsRequest,
};

const makeRequest = async (
  rr: RemoteRecording,
  path: string,
  method: string,
  statusCodes: number[] = [200, 201, 204]
): Promise<any> => {
  const options = Object.assign({}, rr.requestOptions, {
    path,
    method,
  });

  const requestFn = HTTP[rr.requestOptions.protocol!];
  return new Promise((resolve, reject) => {
    const req = requestFn(options, (res: IncomingMessage) => {
      if (!statusCodes.includes(res.statusCode!)) {
        return reject(`HTTP status code ${res.statusCode}`);
      }

      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (e: Error) => {
      reject(e.message);
    });

    req.end();
  });
};

export default class RemoteRecording {
  constructor(public requestOptions: RequestOptions) {}

  async start(): Promise<boolean> {
    const statusCode = (
      await makeRequest(
        this,
        `${this.requestOptions.path}_appmap/record`,
        'POST',
        [200, 201, 409]
      )
    ).statusCode;

    if (statusCode < 300) {
      return true;
    } else {
      return false;
    }
  }

  async status(): Promise<RemoteRecordingStatus> {
    return JSON.parse(
      (
        await makeRequest(
          this,
          `${this.requestOptions.path}_appmap/record`,
          'GET'
        )
      ).data
    );
  }

  async stop(): Promise<string | null> {
    const { statusCode, data } = await makeRequest(
      this,
      `${this.requestOptions.path}_appmap/record`,
      'DELETE',
      [200, 404]
    );

    if (statusCode === 200) {
      return data;
    } else {
      return null;
    }
  }
}
