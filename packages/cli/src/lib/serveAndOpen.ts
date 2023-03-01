import { createReadStream } from 'fs';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import open from 'open';
import { extname, isAbsolute, join } from 'path';
import { parse } from 'url';
import { exists, verbose } from '../utils';
import UI from '../cmds/userInteraction';

function mimeTypeOfName(filename: string): string {
  return (
    {
      js: 'application/javascript',
      css: 'text/css',
      json: 'application/json',
      map: 'application/json',
    }[extname(filename)] || 'application/octet-stream'
  );
}

export default async function serveAndOpen(
  file: string,
  resources: Record<string, string>,
  verifyInSubdir: boolean,
  onListen: (url: string) => void
) {
  UI.progress(`Opening ${file}`);

  const baseDir = join(__dirname, '..', '..', 'built', 'html');
  if (!(await exists(join(baseDir, file)))) throw new Error(`File ${file} does not exist`);

  const server = createServer(async (req, res) => {
    const send404 = () => {
      res.writeHead(404);
      res.end();
    };

    const serveStaticFile = (dir: string, fileName: string, contentType?: string) => {
      const path = isAbsolute(fileName) ? fileName : join(dir, fileName);
      if (verifyInSubdir && !path.startsWith(dir)) return send404();

      if (!contentType) contentType = mimeTypeOfName(fileName);

      res.writeHead(200, 'OK', { 'Content-Type': contentType });

      const fileStream = createReadStream(path);
      fileStream.pipe(res);
      fileStream.on('open', function () {
        if (verbose()) {
          console.log(`${path}: 200`);
        }
        res.writeHead(200);
      });
      fileStream.on('error', function (e) {
        if (verbose()) {
          console.log(`${path}: 404 (${e})`);
        }
        send404();
      });
    };

    try {
      if (verbose()) {
        console.log(req.url);
      }

      const requestUrl = parse(req.url!);
      const pathname = requestUrl.pathname;
      if (pathname === '/') {
        return serveStaticFile(baseDir, file, 'text/html');
      } else if (pathname === '/resource') {
        const pathname = requestUrl.query;
        if (pathname) serveStaticFile(process.cwd(), decodeURIComponent(pathname));
        else send404();
      } else {
        serveStaticFile(baseDir, (pathname || '/').slice(1));
      }

    } catch (e: any) {
      console.log(e.stack);
      res.writeHead(500);
      res.end(); // end the response so browsers don't hang
    }
  })
    .listen(0, '127.0.0.1', () => {
      const port = (server!.address() as AddressInfo).port;

      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(resources)) {
        params.append(key, value);
      }
      const url = new URL(`http://localhost:${port}/?${params.toString()}`);
      onListen(url.toString());
    })
    .on('connection', function (socket) {
      // Don't let the open socket keep the process alive.
      socket.unref();
    })
    .unref();
}

export async function serveAndOpenSequenceDiagram(
  diagramFile: string,
  verifyInSubdir: boolean,
  onListen: (url: string) => void
): Promise<string> {
  return new Promise((resolve) => {
    serveAndOpen(
      'sequenceDiagram.html',
      {
        diagram: diagramFile,
      },
      verifyInSubdir,
      async (url) => {
        onListen(url);
        resolve(url);
      }
    );
  });
}

export async function serveAndOpenAppMap(
  appMapFile: string,
  verifyInSubdir: boolean
): Promise<string> {
  return new Promise((resolve) => {
    serveAndOpen(
      'appmap.html',
      {
        appmap: appMapFile,
      },
      verifyInSubdir,
      async (url) => {
        await tryOpen(url);
        resolve(url);
      }
    );
  });
}

async function tryOpen(url: string) {
  const showMessage = () =>
    UI.warn(`\nWe could not open the browser automatically.\nOpen ${url} to view the content.\n`);
  const cp = await open(url);
  cp.once('error', showMessage);
  cp.once('exit', (code, signal) => (code || signal) && showMessage());
}
