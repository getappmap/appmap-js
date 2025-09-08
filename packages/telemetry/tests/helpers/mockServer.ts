import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'http';

export function createMockServer() {
  let server: Server;
  const receivedRequests: { headers: IncomingMessage['headers']; url: string; body: string }[] = [];
  const requestHandler = jest.fn((req: IncomingMessage, res: ServerResponse) => {
    let body = '';
    req.on('data', (chunk) => {
      body += String(chunk);
    });
    req.on('end', () => {
      receivedRequests.push({
        headers: req.headers,
        url: req.url || '',
        body,
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text: 'Success', code: 0 }));
    });
  });

  const start = (done: () => void) => {
    server = createServer((req, res) => requestHandler(req, res));
    server.listen(0, '127.0.0.1', done);
  };

  const stop = (done: () => void) => {
    server.close(done);
  };

  const getServerPort = (): number => {
    const address = server.address();
    if (typeof address === 'string' || !address) {
      throw new Error('Server not running');
    }
    return address.port;
  };

  const clear = () => {
    receivedRequests.length = 0;
    requestHandler.mockClear();
  };

  return {
    start,
    stop,
    getServerPort,
    receivedRequests,
    requestHandler,
    clear,
  };
}