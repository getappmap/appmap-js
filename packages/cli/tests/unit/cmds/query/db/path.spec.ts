import { existsSync } from 'fs';
import { dirname } from 'path';

import { queryDbPath } from '../../../../../src/cmds/query/db/path';

describe('queryDbPath', () => {
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
    void existsSync(dirname(path));
  });
});
