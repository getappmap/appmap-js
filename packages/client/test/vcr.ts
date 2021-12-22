import yakbak from 'yakbak';
import { createServer, RequestListener, Server } from 'http';
import { ProvidesCallback } from './jest';
import { waitUntil } from './util';

let TheServer: Server | null;
let TestCount = 0;
let Port = 3001;
let MaxPort = 3999;

console.time('server');

async function maybeQuit() {
  if (TestCount === 0) {
    TheServer!.close();
    TheServer = null;
  }
}

function startServer() {
  if (TheServer) return;

  process.env.APPLAND_URL = `http://localhost:${Port}`;
  process.env.APPLAND_API_KEY =
    'a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5';

  console.timeLog('server', `Starting server on port ${Port}`);

  const handler = yakbak('http://localhost:3000', {
    dirname: __dirname + '/tapes',
    noRecord: true,
  });
  const server = createServer(handler as unknown as RequestListener)
    .listen(Port)
    .once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        Port += 1;
        if (Port < MaxPort) {
          startServer();
        }
      }
    })
    .on('listening', () => console.timeLog('server', `server listening`))
    .on('listening', () => (TheServer = server));
}

export function queueTest(test: Function): ProvidesCallback {
  TestCount += 1;

  startServer();

  return () =>
    waitUntil(() => !!TheServer)
      .then(() => test())
      .finally(() => {
        TestCount -= 1;
        maybeQuit;
      });
}
