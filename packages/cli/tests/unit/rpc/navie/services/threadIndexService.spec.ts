/* eslint-disable @typescript-eslint/no-explicit-any,
                  @typescript-eslint/no-unsafe-assignment,
                  @typescript-eslint/no-unsafe-call,
                  @typescript-eslint/no-unsafe-member-access
*/

import { container } from 'tsyringe';
import { ThreadIndexService } from '../../../../../src/rpc/navie/services/threadIndexService';
import sqlite3 from 'better-sqlite3';
import configuration from '../../../../../src/rpc/configuration';

describe('ThreadIndexService', () => {
  let threadIndexService: ThreadIndexService;
  let db: sqlite3.Database;
  const threadId = '00000000-0000-0000-0000-000000000000';

  beforeEach(() => {
    container.reset();
    db = new sqlite3(':memory:');
    container.registerInstance(ThreadIndexService.DATABASE, db);
    threadIndexService = container.resolve(ThreadIndexService);
  });

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
  describe('query', () => {});
});
