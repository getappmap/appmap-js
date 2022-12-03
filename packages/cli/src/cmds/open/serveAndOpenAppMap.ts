import { createReadStream } from 'fs';
import { createServer, ServerResponse } from 'http';
import { AddressInfo, Server } from 'net';
import open from 'open';
import { extname, join } from 'path';
import { parse } from 'url';
import { exists, verbose } from '../../utils';
import UI from '../userInteraction';

function mimeTypeOfName(filename: string): string {
  return (
    {
      js: 'application/javascript',
      css: 'text/css',
      map: 'application/json',
    }[extname(filename)] || 'application/octet-stream'
  );
}

export default async function serveAndOpenAppMap(appMapFile: string) {
  UI.progress(`Opening ${appMapFile}`);

  const baseDir = join(__dirname, '..', '..', '..', 'built', 'html');

  const server = createServer(async (req, res) => {
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
      } else if (pathname === '/appmap') {
        const urlParams = new URLSearchParams(requestUrl.query!);
        const appMapFile = urlParams.get('file');
        if (appMapFile) {
          return serveStaticFile(appMapFile!, 'application/json');
        }
      } else if (pathname && !pathname.startsWith('.')) {
        const path = join(baseDir, pathname);
        return serveStaticFile(path, mimeTypeOfName(path));
      }

      if (verbose()) {
        console.log(`${pathname}: 404`);
      }
      res.writeHead(404);
      res.end();
    } catch (e: any) {
      console.log(e.stack);
      res.writeHead(500);
      res.end(); // end the response so browsers don't hang
    }
  })
    .listen(0, '127.0.0.1', () => {
      const port = (server!.address() as AddressInfo).port;
      tryOpen(`http://localhost:${port}/?appmap=${encodeURIComponent(appMapFile)}`);
    })
    .on('connection', function (socket) {
      // Don't let the open socket keep the process alive.
      socket.unref();
    })
    .unref();
}

async function tryOpen(url: string) {
  const showMessage = () =>
    UI.warn(`\nWe could not open the browser automatically.\nOpen ${url} to see the AppMap.\n`);
  const cp = await open(url);
  cp.once('error', showMessage);
  cp.once('exit', (code, signal) => (code || signal) && showMessage());
}
