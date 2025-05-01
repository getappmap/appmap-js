/* eslint-disable @typescript-eslint/no-explicit-any,
                  @typescript-eslint/no-unsafe-assignment,
                  @typescript-eslint/no-unsafe-call,
                  @typescript-eslint/no-unsafe-member-access
*/

import sqlite3 from 'better-sqlite3';
import { container } from 'tsyringe';
import {
  ThreadIndexItem,
  ThreadIndexService,
} from '../../../../../src/rpc/navie/services/threadIndexService';
import configuration from '../../../../../src/rpc/configuration';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';

describe('ThreadIndexService', () => {
  let tmpDir: string;
  let threadIndexService: ThreadIndexService;
  let db: sqlite3.Database;
  const threadId = '00000000-0000-0000-0000-000000000000';

  beforeEach(async () => {
    container.reset();
    db = new sqlite3(':memory:');
    container.registerInstance(ThreadIndexService.DATABASE, db);
    threadIndexService = container.resolve(ThreadIndexService);

    // Create a fake database file on disk for file locking
    tmpDir = await mkdtemp('thread-index-test-');
    const mockDbFile = join(tmpDir, 'mock.db');
    await writeFile(mockDbFile, '');

    await threadIndexService.migrate(mockDbFile);
  });

  afterEach(() => rm(tmpDir, { recursive: true, force: true }));

  describe('indexThread', () => {
    it('indexes a thread', () => {
      const path = 'example-thread-history.jsonl';
      const title = 'example title';
      threadIndexService.index(threadId, path, title);

      const result = db.prepare('SELECT * FROM threads WHERE id = ?').get(1);
      expect(result).toEqual({
        id: 1,
        uuid: threadId,
        path,
        title,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('updates the thread if it already exists', () => {
      const path = 'example-thread-history.jsonl';
      threadIndexService.index(threadId, path, 'old title');
      threadIndexService.index(threadId, path, 'new title');

      expect(db.prepare('SELECT * FROM threads WHERE id = ?').get(1)).toEqual({
        id: 1,
        uuid: threadId,
        path,
        title: 'new title',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('indexes project directories', () => {
      const path = 'example-thread-history.jsonl';
      const projectDirectories = ['/home/user/dev/applandinc/appmap-js', '/home/user/dev'];
      configuration().projectDirectories = projectDirectories;
      threadIndexService.index(threadId, path, 'title');
      const result = db.prepare('SELECT * FROM project_directories').all();
      expect(result).toEqual(
        projectDirectories.map((path, i) => ({
          id: i + 1,
          path,
          thread_id: threadId,
        }))
      );
    });
  });
  describe('deleteThread', () => {
    it('deletes a thread', () => {
      const path = 'example-thread-history.jsonl';
      threadIndexService.index(threadId, path, 'title');
      threadIndexService.delete(threadId);
      expect(db.prepare('SELECT * FROM threads').all()).toEqual([]);
    });
    it('does nothing if the thread does not exist', () => {
      expect(() => threadIndexService.delete(threadId)).not.toThrow();
    });
  });
  describe('query', () => {
    const daysAgo = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d;
    };

    const threads = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        path: 'three-days-old.jsonl',
        title: 'title',
        createdAt: daysAgo(3),
        updatedAt: new Date(),
        projectDirectories: ['/home/user/dev/applandinc/appmap-golang'],
      },
      {
        id: '00000000-0000-0000-0000-000000000000',
        path: 'one-day-old.jsonl',
        title: 'title',
        createdAt: daysAgo(1),
        updatedAt: new Date(),
        projectDirectories: ['/home/user/dev/applandinc/appmap-js'],
      },
    ];

    const toModel = (t: typeof threads[number]): ThreadIndexItem => {
      const fixture: Partial<typeof threads[number]> = { ...t };
      delete fixture.projectDirectories;

      const thread = fixture as typeof threads[number];
      return {
        id: thread.id,
        path: thread.path,
        title: thread.title,
        created_at: t.createdAt.toISOString(),
        updated_at: t.updatedAt.toISOString(),
      };
    };

    beforeEach(() => {
      const insertThread = db.prepare(
        'INSERT INTO threads (uuid, path, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      );
      const insertProjectDirectory = db.prepare(
        'INSERT INTO project_directories (thread_id, path) VALUES (?, ?)'
      );

      try {
        db.exec('BEGIN TRANSACTION');

        threads.forEach((thread) => {
          insertThread.run([
            thread.id,
            thread.path,
            thread.title,
            thread.createdAt.toISOString(),
            thread.updatedAt.toISOString(),
          ]);
          thread.projectDirectories.forEach((projectDirectory) =>
            insertProjectDirectory.run([thread.id, projectDirectory])
          );
        });

        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    });

    it('returns everything if no options are provided', () => {
      expect(threadIndexService.query({})).toEqual(threads.map(toModel));
    });

    it('looks up by uuid', () => {
      expect(threadIndexService.query({ uuid: threads[1].id })).toEqual([toModel(threads[1])]);
    });

    it('looks up by max created at', () => {
      expect(threadIndexService.query({ maxCreatedAt: daysAgo(2) })).toEqual([toModel(threads[1])]);
    });

    it('can look up by uuid and max created at', () => {
      // This is an oddity, but its technically possible given the `QueryOptions` interface.
      expect(threadIndexService.query({ uuid: threads[1].id, maxCreatedAt: daysAgo(2) })).toEqual([
        toModel(threads[1]),
      ]);
    });

    it('orders by', () => {
      const result = threadIndexService.query({ orderBy: 'created_at' });
      expect(result).toEqual([...threads].reverse().map(toModel));
    });

    it('limits', () => {
      const result = threadIndexService.query({ limit: 1 });
      expect(result).toEqual(threads.slice(0, 1).map(toModel));
    });

    it('offsets', () => {
      const result = threadIndexService.query({ limit: 1, offset: 1 });
      expect(result).toEqual(threads.slice(1).map(toModel));
    });

    it('fails if offset is used without a limit', () => {
      expect(() => threadIndexService.query({ offset: 1 })).toThrowError(
        'offset cannot be used without a limit'
      );
    });

    it('validates orderBy option', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(() => threadIndexService.query({ orderBy: 'invalid' } as any)).toThrowError(
        'invalid orderBy option: invalid'
      );
    });
  });
});
