import { IncomingMessage } from 'node:http';

export default function <T>(response: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let data = '';
    response.setEncoding('utf8');
    response.on('data', (chunk) => {
      data += chunk;
    });
    response.on('end', () => {
      let json: T;
      try {
        json = JSON.parse(data) as T;
      } catch (error) {
        reject(
          new Error(`Error parsing JSON response: ${(error as Error).message}`)
        );
        return;
      }
      resolve(json);
    });
  });
}
