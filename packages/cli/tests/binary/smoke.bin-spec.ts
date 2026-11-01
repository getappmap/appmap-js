import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import { buildFixtureProject, runUntilCompletion } from './helpers';

describe('appmap', () => {
  it('runs the help command', async () => {
    const res = await runUntilCompletion(['--help']);
    expect(res.stdout).toStrictEqual(expect.stringContaining('appmap <command>'));
  });

  // Exercises the query database, which relies on the native better-sqlite3
  // addon being bundled into the binary correctly.
  describe('index and query', () => {
    let projectPath: string;
    let queryDb: string;

    beforeAll(async () => {
      projectPath = await buildFixtureProject();
      queryDb = join(projectPath, 'query.db');
      await runUntilCompletion(['index', '--query-db', queryDb], projectPath);
    });

    afterAll(async () => {
      await rm(projectPath, { recursive: true });
    });

    it('lists endpoints', async () => {
      const res = await runUntilCompletion(
        ['query', 'endpoints', '--query-db', queryDb, '--json'],
        projectPath
      );
      expect(JSON.parse(res.stdout)).toMatchObject({
        rows: [{ method: 'DELETE', route: '/api/api_keys', count: 2 }],
        total: 1,
      });
    });

    it('renders the call tree of a recording', async () => {
      const res = await runUntilCompletion(
        ['query', 'tree', 'tmp/appmap/revoke_api_key.appmap.json', '--query-db', queryDb],
        projectPath
      );
      expect(res.stdout).toStrictEqual(
        expect.stringContaining('app/controllers/API::APIKeysController#destroy')
      );
    });
  });
});
