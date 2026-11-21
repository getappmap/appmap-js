import { createReadStream, existsSync, realpathSync, statSync } from 'fs';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import open from 'open';
import { extname, isAbsolute, join, relative, resolve, sep } from 'path';
import { parse } from 'url';
import { verbose } from '../utils';
import UI from '../cmds/userInteraction';

function mimeTypeOfName(filename: string): string {
  // extname() includes the leading dot.
  return (
    {
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.map': 'application/json',
    }[extname(filename)] || 'application/octet-stream'
  );
}

// The regular file at `requested` below `root`, after resolving symlinks, or undefined when it is
// missing, not a regular file, or outside `root`. This checks a stable tree; it does not guard
// against the tree being replaced between this check and the read.
export function containedFile(root: string, requested: string): string | undefined {
  if (isAbsolute(requested)) return;
  try {
    const realRoot = realpathSync(root);
    const path = realpathSync(join(realRoot, requested));
    const fromRoot = relative(realRoot, path);
    if (!fromRoot || fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot))
      return;
    return statSync(path).isFile() ? path : undefined;
  } catch {
    return;
  }
}

function isRegularFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

const RESOURCE_ROUTE = 'resource';

export type ServedPage = {
  // Local files the page fetches, by page parameter. The page receives only a route for each
  // file, never its path, and the server serves no other file under that route.
  resources?: Record<string, string>;
  // Other page parameters.
  params?: Record<string, string>;
};

export default function serveAndOpen(
  file: string,
  { resources = {}, params = {} }: ServedPage,
  onListen: (url: string) => void,
  unrefOnServe = true
) {
  UI.progress(`Opening ${file}`);

  const baseDir = join(__dirname, '..', '..', 'built', 'html');
  if (!existsSync(join(baseDir, file))) throw new Error(`File ${file} does not exist`);

  const boundResources = new Map(
    Object.entries(resources).map(([name, path]) => [name, resolve(process.cwd(), path)])
  );

  const server = createServer((req, res) => {
    const send404 = () => {
      res.writeHead(404);
      res.end();
    };

    const serveFile = (path: string, contentType: string) => {
      const fileStream = createReadStream(path);
      const closeFile = () => fileStream.destroy();
      // Release the file when the client goes away, including while it is still opening.
      res.once('close', closeFile);
      fileStream.once('close', () => res.off('close', closeFile));
      fileStream.pipe(res);
      fileStream.on('open', function () {
        if (res.destroyed) return closeFile();
        if (verbose()) {
          console.log(`${path}: 200`);
        }
        res.writeHead(200, 'OK', { 'Content-Type': contentType });
      });
      fileStream.on('error', function (e) {
        if (verbose()) {
          console.log(`${path}: ${res.headersSent ? 'read error' : '404'} (${e})`);
        }
        if (res.destroyed) return;
        // After the 200 has been sent, cut the response off instead of sending a second status.
        if (res.headersSent) res.destroy(e);
        else send404();
      });
    };

    // Answer only requests addressed to this server, so that a page on another origin cannot
    // reach it through DNS rebinding.
    const { port } = server.address() as AddressInfo;
    if (![`localhost:${port}`, `127.0.0.1:${port}`].includes(req.headers.host ?? '')) {
      res.writeHead(403);
      res.end();
      return;
    }

    try {
      if (verbose()) {
        console.log(req.url);
      }

      const pathname = parse(req.url!).pathname || '/';
      if (pathname === '/') {
        return serveFile(join(baseDir, file), 'text/html');
      }
      if (pathname === `/${RESOURCE_ROUTE}` || pathname.startsWith(`/${RESOURCE_ROUTE}/`)) {
        let name: string;
        try {
          name = decodeURIComponent(pathname.slice(RESOURCE_ROUTE.length + 2));
        } catch {
          return send404();
        }
        const path = boundResources.get(name);
        if (!path || !isRegularFile(path)) return send404();
        return serveFile(path, mimeTypeOfName(path));
      }
      const asset = containedFile(baseDir, pathname.slice(1));
      if (!asset) return send404();
      serveFile(asset, mimeTypeOfName(asset));
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.message);
        console.log(e.stack);
      } else {
        console.log(e);
      }
      res.writeHead(500);
      res.end(); // end the response so browsers don't hang
    }
  })
    .listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;

      const query = new URLSearchParams();
      for (const name of boundResources.keys()) {
        query.append(name, `${RESOURCE_ROUTE}/${encodeURIComponent(name)}`);
      }
      for (const [key, value] of Object.entries(params)) {
        query.append(key, value);
      }
      const url = new URL(`http://localhost:${port}/?${query.toString()}`);
      onListen(url.toString());
    })
    .on('connection', function (socket) {
      // Don't let the open socket keep the process alive.
      socket.unref();
    });
  if (unrefOnServe) server.unref();
}

export async function serveAndOpenSequenceDiagram(
  diagramFile: string,
  onListen: (url: string) => void
): Promise<string> {
  return new Promise((resolve) => {
    serveAndOpen('sequenceDiagram.html', { resources: { diagram: diagramFile } }, async (url) => {
      onListen(url);
      resolve(url);
    });
  });
}

export async function serveAndOpenAppMap(appMapFile: string): Promise<string> {
  return new Promise((resolve) => {
    serveAndOpen('appmap.html', { resources: { appmap: appMapFile } }, async (url) => {
      await tryOpen(url);
      resolve(url);
    });
  });
}

export async function serveAndOpenNavie(rpcPort: number, question?: string): Promise<string> {
  const params: Record<string, string> = {
    rpcPort: rpcPort.toString(),
  };
  if (question) params.question = question;

  return new Promise((resolve) => {
    serveAndOpen(
      'navie.html',
      { params },
      async (url) => {
        await tryOpen(url);
        resolve(url);
      },
      false
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
