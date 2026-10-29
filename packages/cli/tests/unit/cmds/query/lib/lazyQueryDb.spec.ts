import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import { SCHEMA_VERSION } from '../../../../../src/cmds/query/db/schema';
import { LazyQueryDb, shellQuote } from '../../../../../src/cmds/query/lib/lazyQueryDb';

describe('LazyQueryDb', () => {
  let tmpDir: string;
  let dbPath: string;
  let lazy: LazyQueryDb | undefined;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'appmap-lazy-query-db-'));
    dbPath = join(tmpDir, 'query.db');
  });

  afterEach(() => {
    lazy?.close();
    lazy = undefined;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function createDb(seed: boolean, version = SCHEMA_VERSION): void {
    const { db } = openQueryDb('/tmp/ignored', dbPath);
    if (seed)
      db.prepare(
        `INSERT INTO appmaps (name, source_path, git_branch, sql_query_count, elapsed_ms, timestamp)
         VALUES ('rec', '/tmp/rec.appmap.json', 'main', 0, 1, '2026-04-29T12:00:00.000Z')`
      ).run();
    db.pragma(`user_version = ${version}`);
    db.close();
  }

  it('reports a missing DB with the command to build it', async () => {
    lazy = new LazyQueryDb({ queryDb: dbPath });
    await lazy.refresh();
    expect(() => lazy!.get()).toThrow(/No AppMap index found/);
    expect(() => lazy!.get()).toThrow(`appmap index -d ${process.cwd()} --query-db ${dbPath}`);
  });

  it('suggests the running appmap binary, when known', async () => {
    lazy = new LazyQueryDb({ queryDb: dbPath, executable: '/home/me/.appmap/bin/appmap' });
    await lazy.refresh();
    expect(() => lazy!.get()).toThrow(
      `\`/home/me/.appmap/bin/appmap index -d ${process.cwd()} --query-db ${dbPath}\``
    );
  });

  it('names a Windows binary separately when its path would need quoting', () => {
    const plain = new LazyQueryDb({ executable: 'C:\\appmap\\appmap.exe' });
    expect(plain.indexInstructions('win32')).toMatch(/^`C:\\appmap\\appmap\.exe index /);

    // A quoted first word only runs in PowerShell with a leading `&`.
    const spaced = new LazyQueryDb({ executable: 'C:\\Users\\Jane Doe\\appmap.exe' });
    expect(spaced.indexInstructions('win32')).toMatch(/^`appmap index /);
    expect(spaced.indexInstructions('win32')).toMatch(
      /\(if `appmap` isn't on the PATH, it's at "C:\\Users\\Jane Doe\\appmap\.exe"\)$/
    );
    expect(spaced.indexInstructions('linux')).toMatch(/^`'C:\\Users\\Jane Doe\\appmap.exe' index /);
  });

  it('picks up the DB once it appears', async () => {
    lazy = new LazyQueryDb({ queryDb: dbPath });
    await lazy.refresh();
    expect(() => lazy!.get()).toThrow(/No AppMap index found/);

    createDb(true);
    await lazy.refresh();
    expect(lazy.get().prepare('SELECT count(*) AS n FROM appmaps').get()).toEqual({ n: 1 });
  });

  it('reports an index with no recordings, and serves it once filled', async () => {
    createDb(false);
    lazy = new LazyQueryDb({ queryDb: dbPath });
    await lazy.refresh();
    expect(() => lazy!.get()).toThrow(/contains no recordings yet/);

    // The open read-only handle sees what an indexer writes later.
    createDb(true);
    expect(lazy.get()).toBeDefined();
  });

  it('reopens the DB when it is deleted and rebuilt', async () => {
    createDb(true);
    lazy = new LazyQueryDb({ queryDb: dbPath });
    await lazy.refresh();
    expect(lazy.get()).toBeDefined();

    for (const suffix of ['', '-wal', '-shm']) rmSync(dbPath + suffix, { force: true });
    await lazy.refresh();
    expect(() => lazy!.get()).toThrow(/No AppMap index found/);

    createDb(false);
    await lazy.refresh();
    expect(() => lazy!.get()).toThrow(/contains no recordings yet/);
  });

  it('reports a DB built with an older schema', async () => {
    createDb(true, SCHEMA_VERSION - 1);
    lazy = new LazyQueryDb({ queryDb: dbPath });
    await lazy.refresh();
    expect(() => lazy!.get()).toThrow(/older version of the appmap CLI/);
  });

  it('reports a DB built with a newer schema', async () => {
    createDb(true, SCHEMA_VERSION + 1);
    lazy = new LazyQueryDb({ queryDb: dbPath });
    await lazy.refresh();
    expect(() => lazy!.get()).toThrow(/newer version of the appmap CLI/);
  });

  describe('without --query-db', () => {
    let cwd: string;

    beforeEach(() => {
      cwd = process.cwd();
      process.chdir(tmpDir);
    });

    afterEach(() => process.chdir(cwd));

    it('reports a missing appmap.yml, and recovers once it is written', async () => {
      lazy = new LazyQueryDb({});
      await lazy.refresh();
      expect(() => lazy!.get()).toThrow(/AppMap is not configured/);

      writeFileSync(join(tmpDir, 'appmap.yml'), 'name: test\nappmap_dir: tmp/appmap\n');
      await lazy.refresh();
      expect(() => lazy!.get()).toThrow(/No AppMap index found/);
      expect(() => lazy!.get()).toThrow(/tmp\/appmap does not exist yet/);

      mkdirSync(join(tmpDir, 'tmp/appmap'), { recursive: true });
      await lazy.refresh();
      expect(() => lazy!.get()).toThrow(/No AppMap index found.*appear\.$/);
    });

    it('reports a non-path appmap_dir, and recovers once it is fixed', async () => {
      writeFileSync(join(tmpDir, 'appmap.yml'), 'name: test\nappmap_dir: 123\n');
      lazy = new LazyQueryDb({});
      await lazy.refresh();
      expect(() => lazy!.get()).toThrow(/appmap_dir in .* must be a directory path, not 123/);

      writeFileSync(join(tmpDir, 'appmap.yml'), 'name: test\nappmap_dir: tmp/appmap\n');
      await lazy.refresh();
      expect(() => lazy!.get()).toThrow(/No AppMap index found/);
    });

    it('reports an unreadable appmap.yml as such', async () => {
      writeFileSync(join(tmpDir, 'appmap.yml'), 'name: [unclosed\n');
      lazy = new LazyQueryDb({});
      await lazy.refresh();
      expect(() => lazy!.get()).toThrow(/Failed to read appmap.yml/);
    });
  });
});

describe('shellQuote', () => {
  it('leaves plain arguments alone', () => {
    expect(shellQuote('/home/me/proj', 'linux')).toBe('/home/me/proj');
    expect(shellQuote('C:\\Users\\me\\proj', 'win32')).toBe('C:\\Users\\me\\proj');
  });

  it('single-quotes for POSIX shells', () => {
    expect(shellQuote("my app's maps", 'darwin')).toBe(`'my app'\\''s maps'`);
  });

  it('double-quotes on Windows, where cmd.exe ignores single quotes', () => {
    expect(shellQuote("C:\\Users\\Jane Doe\\my app's maps", 'win32')).toBe(
      `"C:\\Users\\Jane Doe\\my app's maps"`
    );
  });

  it('doubles trailing backslashes on Windows, so the closing quote survives', () => {
    expect(shellQuote('C:\\my maps\\', 'win32')).toBe('"C:\\my maps\\\\"');
  });
});
