import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { get } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import serveAndOpen from '../../../src/lib/serveAndOpen';

type Served = { status?: number; contentType?: string };

function request(url: URL): Promise<Served> {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      res.resume();
      res.on('end', () =>
        resolve({ status: res.statusCode, contentType: res.headers['content-type'] })
      );
    }).on('error', reject);
  });
}

function serve(): Promise<URL> {
  return new Promise((resolve) =>
    serveAndOpen('appmap.html', {}, false, (url) => {
      const base = new URL(url);
      // The server listens on 127.0.0.1 only; localhost may resolve to ::1 first.
      base.hostname = '127.0.0.1';
      resolve(base);
    })
  );
}

describe('serveAndOpen', () => {
  let base: URL;
  let fixtureDir: string;

  beforeAll(async () => {
    fixtureDir = mkdtempSync(join(tmpdir(), 'serve-and-open-'));
    for (const name of [
      'fixture.js',
      'fixture.css',
      'fixture.json',
      'fixture.js.map',
      'fixture.bin',
    ])
      writeFileSync(join(fixtureDir, name), '{}\n');
    base = await serve();
  });

  afterAll(() => rmSync(fixtureDir, { recursive: true, force: true }));

  it('serves the viewer page as text/html', async () => {
    expect(await request(new URL('/', base))).toEqual({ status: 200, contentType: 'text/html' });
  });

  it.each([
    ['/appmap.js', 'application/javascript'],
    ['/appmap.css', 'text/css'],
    ['/appmap.js.map', 'application/json'],
  ])('serves the built asset %s as %s', async (path, contentType) => {
    expect(await request(new URL(path, base))).toEqual({ status: 200, contentType });
  });

  it.each([
    ['fixture.js', 'application/javascript'],
    ['fixture.css', 'text/css'],
    ['fixture.json', 'application/json'],
    ['fixture.js.map', 'application/json'],
    ['fixture.bin', 'application/octet-stream'],
  ])('serves the resource %s as %s', async (name, contentType) => {
    const url = new URL(`/resource?${encodeURIComponent(join(fixtureDir, name))}`, base);
    expect(await request(url)).toEqual({ status: 200, contentType });
  });
});
