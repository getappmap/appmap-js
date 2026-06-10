import { importExceptions } from '../../../../../../src/cmds/query/db/import/exceptions';
import { buildParentEventMap } from '../../../../../../src/cmds/query/db/import/parentEventMap';
import { freshDb } from './helpers';

function seedAppmap(db: any): number {
  const info = db
    .prepare("INSERT INTO appmaps (name, source_path) VALUES ('rec', '/tmp/rec.appmap.json')")
    .run();
  return Number(info.lastInsertRowid);
}

describe('importExceptions', () => {
  it('inserts one row per exception entry, preserving class/message/path/lineno', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        { id: 1, event: 'call', thread_id: 7 },
        {
          id: 2,
          event: 'return',
          parent_id: 1,
          thread_id: 7,
          exceptions: [
            {
              class: 'IntegrityError',
              message: 'duplicate key',
              path: 'app/models/order.rb',
              lineno: 42,
            },
          ],
        },
      ];
      importExceptions(db, appmapId, events, buildParentEventMap(events));
      const row = db.prepare('SELECT * FROM exceptions').get() as any;
      expect(row.exception_class).toBe('IntegrityError');
      expect(row.message).toBe('duplicate key');
      expect(row.path).toBe('app/models/order.rb');
      expect(row.lineno).toBe(42);
      expect(row.thread_id).toBe(7);
    } finally {
      db.close();
    }
  });

  it('expands multiple exceptions on the same return event into multiple rows', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        { id: 1, event: 'call', thread_id: 1 },
        {
          id: 2,
          event: 'return',
          parent_id: 1,
          exceptions: [{ class: 'A' }, { class: 'B' }],
        },
      ];
      importExceptions(db, appmapId, events, buildParentEventMap(events));
      const rows = db
        .prepare('SELECT exception_class FROM exceptions ORDER BY id')
        .all()
        .map((r: any) => r.exception_class);
      expect(rows).toEqual(['A', 'B']);
    } finally {
      db.close();
    }
  });

  it('skips events without an exceptions array', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      importExceptions(db, appmapId, [{ id: 1, event: 'call' }], new Map());
      expect((db.prepare('SELECT COUNT(*) AS n FROM exceptions').get() as any).n).toBe(0);
    } finally {
      db.close();
    }
  });

  it('uses the call event id (not the return event id) for event_id and derives parent_event_id from the call', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        { id: 10, event: 'call', thread_id: 1 }, // outer
        { id: 11, event: 'call', thread_id: 1 }, // inner — parent is 10
        {
          id: 12,
          event: 'return',
          parent_id: 11,
          thread_id: 1,
          exceptions: [{ class: 'BoomError' }],
        },
      ];
      importExceptions(db, appmapId, events, buildParentEventMap(events));
      const row = db.prepare('SELECT event_id, parent_event_id FROM exceptions').get() as any;
      expect(row.event_id).toBe(11); // call id, not return id
      expect(row.parent_event_id).toBe(10); // parent of the call
    } finally {
      db.close();
    }
  });

  it('leaves parent_event_id NULL when the failing call is at the top of its thread', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        { id: 1, event: 'call', thread_id: 1 }, // top-level call
        {
          id: 2,
          event: 'return',
          parent_id: 1,
          thread_id: 1,
          exceptions: [{ class: 'TopLevelError' }],
        },
      ];
      importExceptions(db, appmapId, events, buildParentEventMap(events));
      const row = db.prepare('SELECT event_id, parent_event_id FROM exceptions').get() as any;
      expect(row.event_id).toBe(1);
      expect(row.parent_event_id).toBeNull();
    } finally {
      db.close();
    }
  });

  it('still imports legacy recordings that place exceptions on the call event', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        { id: 1, event: 'call', thread_id: 1 }, // outer
        {
          id: 2,
          event: 'call',
          thread_id: 1, // inner — exceptions attached here directly
          exceptions: [{ class: 'LegacyError' }],
        },
        { id: 3, event: 'return', parent_id: 2, thread_id: 1 },
      ];
      importExceptions(db, appmapId, events, buildParentEventMap(events));
      const row = db.prepare('SELECT event_id, parent_event_id FROM exceptions').get() as any;
      expect(row.event_id).toBe(2);
      expect(row.parent_event_id).toBe(1);
    } finally {
      db.close();
    }
  });

  it('de-dups when the same call has exceptions on both call and return events (return wins)', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        {
          id: 1,
          event: 'call',
          thread_id: 1,
          exceptions: [{ class: 'OnCall' }],
        },
        {
          id: 2,
          event: 'return',
          parent_id: 1,
          thread_id: 1,
          exceptions: [{ class: 'OnReturn' }],
        },
      ];
      importExceptions(db, appmapId, events, buildParentEventMap(events));
      const rows = db
        .prepare('SELECT exception_class FROM exceptions ORDER BY id')
        .all()
        .map((r: any) => r.exception_class);
      expect(rows).toEqual(['OnReturn']);
    } finally {
      db.close();
    }
  });
});
