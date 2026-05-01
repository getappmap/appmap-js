import { importSqlQueries } from '../../../../../../src/cmds/query/db/import/sqlQueries';
import { buildReturnEventMap } from '../../../../../../src/cmds/query/db/import/returnEventMap';
import { buildParentEventMap } from '../../../../../../src/cmds/query/db/import/parentEventMap';
import { freshDb } from './helpers';

function seedAppmap(db: any): number {
  const info = db
    .prepare("INSERT INTO appmaps (name, source_path) VALUES ('rec', '/tmp/rec.appmap.json')")
    .run();
  return Number(info.lastInsertRowid);
}

describe('importSqlQueries', () => {
  it('inserts one row per sql_query event with caller from the event', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        {
          id: 1,
          event: 'call',
          thread_id: 1,
          defined_class: 'OrdersController',
          method_id: 'create',
          sql_query: { sql: 'INSERT INTO orders (...)', database_type: 'postgres', server_version: '14.5' },
        },
        { id: 2, event: 'return', parent_id: 1, elapsed: 0.014 },
      ];
      importSqlQueries(
        db,
        appmapId,
        events,
        buildReturnEventMap(events),
        buildParentEventMap(events)
      );
      const row = db.prepare('SELECT * FROM sql_queries').get() as any;
      expect(row.sql_text).toBe('INSERT INTO orders (...)');
      expect(row.database_type).toBe('postgres');
      expect(row.server_version).toBe('14.5');
      expect(row.caller_class).toBe('OrdersController');
      expect(row.caller_method).toBe('create');
      expect(row.elapsed_ms).toBeCloseTo(14);
    } finally {
      db.close();
    }
  });

  it('derives caller from the parent call event when the sql event lacks defined_class', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        {
          id: 1,
          event: 'call',
          thread_id: 1,
          defined_class: 'OrdersController',
          method_id: 'create',
        },
        {
          id: 2,
          event: 'call',
          thread_id: 1,
          // no defined_class on the SQL event itself
          sql_query: { sql: 'SELECT 1' },
        },
        { id: 3, event: 'return', parent_id: 2 },
        { id: 4, event: 'return', parent_id: 1 },
      ];
      importSqlQueries(
        db,
        appmapId,
        events,
        buildReturnEventMap(events),
        buildParentEventMap(events)
      );
      const row = db.prepare('SELECT caller_class, caller_method FROM sql_queries').get() as any;
      expect(row.caller_class).toBe('OrdersController');
      expect(row.caller_method).toBe('create');
    } finally {
      db.close();
    }
  });
});
