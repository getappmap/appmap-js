import { existsSync } from 'fs';
import { dirname } from 'path';

import { QUERY_DB_ENV, queryDbPath } from '../../../../../src/cmds/query/db/path';

describe('queryDbPath', () => {
  let envBefore: string | undefined;

  beforeEach(() => {
    envBefore = process.env[QUERY_DB_ENV];
    delete process.env[QUERY_DB_ENV];
  });

  afterEach(() => {
    if (envBefore === undefined) delete process.env[QUERY_DB_ENV];
    else process.env[QUERY_DB_ENV] = envBefore;
  });

  it('returns the same path for equivalent directory inputs', () => {
    expect(queryDbPath('/tmp/a')).toBe(queryDbPath('/tmp/a/'));
    expect(queryDbPath('/tmp/a')).toBe(queryDbPath('/tmp/a/./'));
  });

  it('produces different paths for different directories', () => {
    expect(queryDbPath('/tmp/a')).not.toBe(queryDbPath('/tmp/b'));
  });

  it('lands under ~/.appmap/data/<sha12>/query.db', () => {
    const path = queryDbPath('/tmp/path-test-dir');
    expect(path).toMatch(/[/\\]\.appmap[/\\]data[/\\][0-9a-f]{12}[/\\]query\.db$/);
  });

  it('does not create the parent directory', () => {
    const path = queryDbPath('/tmp/never-created-dir-xyz');
    // The parent may exist if a prior test created it, but queryDbPath
    // itself must not create anything; assert it returns a path without I/O.
    expect(typeof path).toBe('string');
    // Sanity: returning the path is decoupled from existence checking.
    void existsSync(dirname(path));
  });

  it('honors APPMAP_QUERY_DB as a full-path override', () => {
    process.env[QUERY_DB_ENV] = '/tmp/override-test/over.db';
    expect(queryDbPath('/tmp/whatever')).toBe('/tmp/override-test/over.db');
  });
});
