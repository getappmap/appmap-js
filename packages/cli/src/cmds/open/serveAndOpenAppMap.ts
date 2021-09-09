import { createReadStream } from 'fs';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import open from 'open';
import { parse } from 'url';
import UI from '../userInteraction';

export default async function serveAndOpenAppMap(appMapFile: string) {
  UI.progress(`Opening ${appMapFile}`);

  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      try {
        var requestUrl = parse(req.url!);
        const pathname = requestUrl.pathname;
        if (pathname === '/appmap.html') {
          res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });

          // TODO: Create and serve the HTML page with the AppMap

          const fileStream = createReadStream(appMapFile);
          fileStream.pipe(res);
          fileStream.on('open', function () {
            res.writeHead(200);
          });
          fileStream.on('error', function (e) {
            res.writeHead(404);
            res.end();
          });
          fileStream.on('end', function () {
            // Once the file is served, I can go away.
            // TODO: Doesn't seem to be working though. The process does not exit.
            server.close();
          });
        } else {
          console.log(`Not found: ${pathname}`);
          res.writeHead(404);
          res.end();
        }
      } catch (e) {
        console.log(e.stack);
        res.writeHead(500);
        res.end(); // end the response so browsers don't hang
      }
    }).listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      resolve(open(`http://localhost:${port}/appmap.html`));
    });
  });
}
