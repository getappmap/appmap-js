import fs, { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { Readable } from 'node:stream';

import serveAndOpen, {
  containedFile,
  serveAndOpenSequenceDiagram,
} from '../../../src/lib/serveAndOpen';

// Every file outside the viewer assets is a disposable fixture created here, never host data.

type Served = { status?: number; contentType?: string; body: string };

// Send the path exactly as written: URL parsing would normalize `..` and `//` away.
function request(base: URL, path: string, host?: string): Promise<Served> {
  return new Promise((resolve, reject) => {
    const headers = host ? { host } : undefined;
    const req = httpRequest({ host: base.hostname, port: base.port, path, headers }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => (body += chunk));
      res.on('end', () =>
        resolve({ status: res.statusCode, contentType: res.headers['content-type'], body })
      );
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

type Viewer = { base: URL; page: URL };

// Start a viewer page with local files bound to its resource parameters.
function serve(resources: Record<string, string>): Promise<Viewer> {
  return new Promise((resolve) =>
    serveAndOpen('appmap.html', { resources }, (url) => {
      const page = new URL(url);
      // The server listens on 127.0.0.1 only; localhost may resolve to ::1 first.
      page.hostname = '127.0.0.1';
      resolve({ base: new URL('/', page), page });
    })
  );
}

const resourcePath = (viewer: Viewer, name: string) => `/${viewer.page.searchParams.get(name)}`;

// Hand the next createReadStream call a controllable stream that has "opened".
function nextReadStream(stream: Readable, afterOpen: () => void) {
  jest.spyOn(fs, 'createReadStream').mockImplementationOnce((() => {
    setImmediate(() => {
      stream.emit('open');
      afterOpen();
    });
    return stream;
  }) as unknown as typeof fs.createReadStream);
}

describe('serveAndOpen', () => {
  const assets = join(__dirname, '..', '..', '..', 'built', 'html');
  let fixtureDir: string;
  let appmapFile: string;
  let otherFile: string;
  let viewer: Viewer;

  beforeAll(async () => {
    fixtureDir = mkdtempSync(join(tmpdir(), 'serve-and-open-'));
    appmapFile = join(fixtureDir, 'opened.appmap.json');
    otherFile = join(fixtureDir, 'other.json');
    writeFileSync(appmapFile, '{"opened":true}\n');
    writeFileSync(otherFile, '{"other":true}\n');
    viewer = await serve({ appmap: appmapFile });
  });

  afterAll(() => rmSync(fixtureDir, { recursive: true, force: true }));

  it('serves the viewer page as text/html', async () => {
    expect(await request(viewer.base, '/')).toMatchObject({
      status: 200,
      contentType: 'text/html',
    });
  });

  it.each([
    ['/appmap.js', 'application/javascript'],
    ['/appmap.css', 'text/css'],
    ['/appmap.js.map', 'application/json'],
  ])('serves the built asset %s as %s', async (path, contentType) => {
    expect(await request(viewer.base, path)).toMatchObject({ status: 200, contentType });
  });

  describe('Given a viewer opened for one AppMap', () => {
    it('When the page URL is built, Then it names a resource route instead of the local path', () => {
      expect(viewer.page.searchParams.get('appmap')).toBe('resource/appmap');
      expect(decodeURIComponent(viewer.page.toString())).not.toContain(fixtureDir);
    });

    it('When the page fetches its resource, Then the opened file is served as JSON', async () => {
      expect(await request(viewer.base, resourcePath(viewer, 'appmap'))).toEqual({
        status: 200,
        contentType: 'application/json',
        body: '{"opened":true}\n',
      });
    });

    it.each([
      ['another local file by path', () => `/resource?${encodeURIComponent(otherFile)}`],
      ['the opened file by path', () => `/resource?${encodeURIComponent(appmapFile)}`],
      ['a resource name that was not bound', () => '/resource/other'],
      ['the resource route without a name', () => '/resource'],
    ])('When a client requests %s, Then it is refused', async (_case, path) => {
      expect((await request(viewer.base, path())).status).toBe(404);
    });

    it.each([
      ['an absolute path', () => `/${otherFile}`],
      ['dot segments', () => `/${relative(assets, otherFile)}`],
    ])(
      'When a static request names a file outside the viewer assets with %s, Then it is refused',
      async (_case, path) => {
        expect((await request(viewer.base, path())).status).toBe(404);
      }
    );

    it('When a resource name is not valid percent-encoding, Then it is refused', async () => {
      expect((await request(viewer.base, '/resource/%E0%A4%A')).status).toBe(404);
    });

    it.each([
      ['localhost', 200, (port: string) => `localhost:${port}`],
      ['the loopback address', 200, (port: string) => `127.0.0.1:${port}`],
      ['another host name', 403, (port: string) => `attacker.example:${port}`],
      ['no port', 403, () => 'localhost'],
    ])('When the Host header names %s, Then the server answers %i', async (_case, status, host) => {
      const served = await request(
        viewer.base,
        resourcePath(viewer, 'appmap'),
        host(viewer.base.port)
      );
      expect(served.status).toBe(status);
    });

    it('When a directory is requested, Then it is refused and the server keeps serving', async () => {
      expect((await request(viewer.base, '/query-ui')).status).toBe(404);
      expect((await request(viewer.base, '/appmap.js')).status).toBe(200);
    });
  });

  it.each([
    ['fixture.js', 'application/javascript'],
    ['fixture.css', 'text/css'],
    ['fixture.json', 'application/json'],
    ['fixture.js.map', 'application/json'],
    ['fixture.bin', 'application/octet-stream'],
  ])('serves the bound resource %s as %s', async (name, contentType) => {
    const file = join(fixtureDir, name);
    writeFileSync(file, '{}\n');
    const typed = await serve({ appmap: file });
    expect(await request(typed.base, resourcePath(typed, 'appmap'))).toMatchObject({
      status: 200,
      contentType,
    });
  });

  it('Given a sequence diagram, When its viewer starts, Then the page fetches it from its route', async () => {
    const page = new URL(await serveAndOpenSequenceDiagram(appmapFile, () => undefined));
    page.hostname = '127.0.0.1';
    expect(page.searchParams.get('diagram')).toBe('resource/diagram');
    expect(await request(new URL('/', page), '/resource/diagram')).toMatchObject({
      status: 200,
      body: '{"opened":true}\n',
    });
  });

  it('Given a bound directory, When it is requested, Then it is refused', async () => {
    const bound = await serve({ appmap: fixtureDir });
    expect((await request(bound.base, resourcePath(bound, 'appmap'))).status).toBe(404);
  });

  it('Given a read that fails after the response started, When the error arrives, Then the response is cut off and the server keeps serving', async () => {
    const failing = new Readable({ read() {} });
    nextReadStream(failing, () => {
      failing.push('{"partial":');
      setImmediate(() => failing.destroy(new Error('injected read failure')));
    });
    await expect(request(viewer.base, resourcePath(viewer, 'appmap'))).rejects.toThrow();
    expect((await request(viewer.base, resourcePath(viewer, 'appmap'))).status).toBe(200);
  });

  it('Given a client that disconnects while a resource streams, When the connection closes, Then the file stream is closed', async () => {
    const slow = new Readable({ read() {} });
    nextReadStream(slow, () => slow.push('{"first":'));
    await new Promise<void>((resolve) => {
      const req = httpRequest(
        {
          host: viewer.base.hostname,
          port: viewer.base.port,
          path: resourcePath(viewer, 'appmap'),
        },
        (res) => res.once('data', () => req.destroy())
      );
      req.on('error', () => undefined);
      req.on('close', resolve);
      req.end();
    });
    for (let i = 0; i < 100 && !slow.destroyed; i++) await new Promise((r) => setTimeout(r, 10));
    expect(slow.destroyed).toBe(true);
  });
});

describe('containedFile', () => {
  let scratch: string;
  let root: string;

  beforeAll(() => {
    scratch = mkdtempSync(join(tmpdir(), 'contained-file-'));
    root = join(scratch, 'root');
    for (const dir of [
      root,
      join(root, 'nested'),
      join(scratch, 'root-neighbor'),
      join(scratch, 'outside'),
    ])
      mkdirSync(dir);
    writeFileSync(join(root, 'inside.js'), '');
    writeFileSync(join(scratch, 'root-neighbor', 'neighbor.js'), '');
    writeFileSync(join(scratch, 'outside', 'outside.js'), '');
    symlinkSync(join(root, 'inside.js'), join(root, 'inside-link.js'));
    symlinkSync(join(scratch, 'outside', 'outside.js'), join(root, 'escape.js'));
    symlinkSync(join(scratch, 'outside'), join(root, 'escape-dir'), 'dir');
  });

  afterAll(() => rmSync(scratch, { recursive: true, force: true }));

  it.each(['inside.js', 'nested/../inside.js', 'inside-link.js'])(
    'Given %s below the root, When resolved, Then it is served',
    (requested) => {
      expect(containedFile(root, requested)).toBe(fs.realpathSync(join(root, 'inside.js')));
    }
  );

  it.each([
    ['a sibling whose name extends the root', '../root-neighbor/neighbor.js'],
    ['a parent traversal', '../outside/outside.js'],
    ['an absolute path', () => join(scratch, 'outside', 'outside.js')],
    ['a symlink to an outside file', 'escape.js'],
    ['a symlink to an outside directory', 'escape-dir/outside.js'],
    ['a directory', 'nested'],
    ['the root itself', ''],
    ['a missing file', 'missing.js'],
  ])('Given %s, When resolved, Then it is refused', (_case, requested) => {
    const path = typeof requested === 'function' ? requested() : requested;
    expect(containedFile(root, path)).toBeUndefined();
  });
});
