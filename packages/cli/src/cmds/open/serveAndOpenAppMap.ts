import { createReadStream } from 'fs';
import { createServer, ServerResponse } from 'http';
import { AddressInfo, Server } from 'net';
import open from 'open';
import { join } from 'path';
import { parse } from 'url';
import { exists, verbose } from '../../utils';
import UI from '../userInteraction';

export default async function serveAndOpenAppMap(appMapFile: string) {
  UI.progress(`Opening ${appMapFile}`);

  const builtDir = join(__dirname, '../../../built');
  const baseDir = (await exists(builtDir))
    ? builtDir
    : join(__dirname, '../..');

  const server = createServer(async (req, res) => {
    // Once a request is received, the server can be closed.
    // The socket will remain open for a while as it serves requests.
    server!.close();

    const serveStaticFile = (fileName: string, contentType: string) => {
      res.writeHead(200, 'OK', { 'Content-Type': contentType });

      const fileStream = createReadStream(fileName);
      fileStream.pipe(res);
      fileStream.on('open', function () {
        if (verbose()) {
          console.log(`${fileName}: 200`);
        }
        res.writeHead(200);
      });
      fileStream.on('error', function (e) {
        if (verbose()) {
          console.log(`${fileName}: 404`);
        }
        res.writeHead(404);
        res.end();
      });
    };

    try {
      if (verbose()) {
        console.log(req.url);
      }

      var requestUrl = parse(req.url!);
      const pathname = requestUrl.pathname;

      if (pathname === '/') {
        return serveStaticFile(join(baseDir, 'appmap.html'), 'text/html');
      } else if (pathname === '/main.js.map') {
        return serveStaticFile(join(baseDir, 'main.js.map'), 'text/javascript');
      } else if (pathname === '/appmap') {
        const urlParams = new URLSearchParams(requestUrl.query!);
        const appMapFile = urlParams.get('file');
        if (appMapFile) {
          return serveStaticFile(appMapFile!, 'application/json');
        }
      }

      if (verbose()) {
        console.log(`${pathname}: 404`);
      }
      res.writeHead(404);
      res.end();
    } catch (e) {
      console.log(e.stack);
      res.writeHead(500);
      res.end(); // end the response so browsers don't hang
    }
  })
    .listen(0, '127.0.0.1', () => {
      const port = (server!.address() as AddressInfo).port;
      open(
        `http://localhost:${port}/?appmap=${encodeURIComponent(appMapFile)}`
      );
    })
    .on('connection', function (socket) {
      // Don't let the open socket keep the process alive.
      socket.unref();
    });
}
