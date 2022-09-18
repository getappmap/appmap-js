import axios, { AxiosAdapter } from 'axios';
import RemoteRecording from './remoteRecording';

export class RemoteRecordingError extends Error {
  constructor(
    public description: string,
    public statusCode: number,
    public method: string,
    public path: string,
    msg: string
  ) {
    super(msg);
  }

  toString(): string {
    return `description: ${this.description}
status: ${this.statusCode}
response text: ${this.message}`;
  }
}

export default async function makeRequest(
  rr: RemoteRecording,
  path: string,
  method: string,
  description: string,
  statusCodes: number[] = [200, 201, 204],
  adapter?: AxiosAdapter
): Promise<any> {
  return new Promise((resolve, reject) => {
    const { hostname: host, protocol, port } = rr.requestOptions;
    const url = `${protocol}//${host}:${port}${path}`;
    axios({
      method,
      url,
      responseType: 'arraybuffer',
      validateStatus: () => true, // status is checked below
      adapter,
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.data.toString();

        if (statusCodes.includes(statusCode)) {
          resolve({ statusCode, data });
        } else {
          reject(new RemoteRecordingError(description, statusCode, method, path, data));
        }
      })
      .catch((e) => {
        reject(e);
      });
  });
}
