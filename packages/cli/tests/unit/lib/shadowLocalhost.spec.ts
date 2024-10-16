import assert from 'node:assert';
import { get, Server } from 'node:http';

import shadowLocalhost from '../../../src/lib/shadowLocalhost';

describe('shadowLocalhost', () => {
  it('should start server on localhost for both IPv4 and IPv6', async () => {
    expect.assertions(4);
    const server = new Server((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });
    server.listen(0, 'localhost');
    const shadow = await shadowLocalhost(server);

    const address = server.address();
    assert(address !== null && typeof address === 'object');
    const port = address.port;

    expect(await httpGet(`http://127.0.0.1:${port}`)).toBe('OK');
    expect(await httpGet(`http://[::1]:${port}`)).toBe('OK');

    const shadowClosed = new Promise<void>((resolve, reject) => {
      shadow.on('close', resolve);
      shadow.on('error', reject);
    });
    server.close();

    await shadowClosed;

    expect(server.listening).toBeFalsy();
    expect(shadow.listening).toBeFalsy();
  });
});

function httpGet(url: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP error ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}
