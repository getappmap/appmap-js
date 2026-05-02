import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import {
  appmapRefClause,
  classFilterClauses,
  methodFilterClauses,
  parseClassRef,
  parseRoute,
} from '../../../../../src/cmds/query/lib/scope';

function freshDb(): sqlite3.Database {
  return openQueryDb('/tmp/ignored', ':memory:').db;
}

describe('parseRoute', () => {
  it('parses an HTTP method case-insensitively and uppercases it', () => {
    expect(parseRoute('post /orders')).toEqual({ method: 'POST', path: '/orders' });
    expect(parseRoute('Get /reports')).toEqual({ method: 'GET', path: '/reports' });
    expect(parseRoute('DELETE /orders/:id')).toEqual({
      method: 'DELETE',
      path: '/orders/:id',
    });
  });

  it('treats an unrecognised prefix as part of the path', () => {
    expect(parseRoute('FOO /bar')).toEqual({ path: 'FOO /bar' });
    expect(parseRoute('/orders')).toEqual({ path: '/orders' });
  });
});

describe('appmapRefClause (basename matching)', () => {
  it('matches Unix-style source_path with .appmap.json suffix', () => {
    const db = freshDb();
    try {
      db.prepare(
        `INSERT INTO appmaps (name, source_path) VALUES ('rec1', '/tmp/path/rec1.appmap.json')`
      ).run();
      const m = appmapRefClause('rec1', 'a');
      const row = db
        .prepare(`SELECT a.name FROM appmaps a WHERE ${m.sql}`)
        .get(...m.params) as { name: string } | undefined;
      expect(row?.name).toBe('rec1');
    } finally {
      db.close();
    }
  });

  it('matches Windows-style source_path with backslash separator', () => {
    const db = freshDb();
    try {
      db.prepare(
        `INSERT INTO appmaps (name, source_path) VALUES ('rec1', 'C:\\Users\\me\\rec1.appmap.json')`
      ).run();
      const m = appmapRefClause('rec1', 'a');
      const row = db
        .prepare(`SELECT a.name FROM appmaps a WHERE ${m.sql}`)
        .get(...m.params) as { name: string } | undefined;
      expect(row?.name).toBe('rec1');
    } finally {
      db.close();
    }
  });

  it('matches source_path without the .appmap.json suffix', () => {
    const db = freshDb();
    try {
      db.prepare(
        `INSERT INTO appmaps (name, source_path) VALUES ('odd', '/store/abc/odd')`
      ).run();
      const m = appmapRefClause('odd', 'a');
      const row = db
        .prepare(`SELECT a.name FROM appmaps a WHERE ${m.sql}`)
        .get(...m.params) as { name: string } | undefined;
      expect(row?.name).toBe('odd');
    } finally {
      db.close();
    }
  });

  it('matches by appmap.name when source_path differs', () => {
    const db = freshDb();
    try {
      db.prepare(
        `INSERT INTO appmaps (name, source_path) VALUES ('Friendly Name', '/x/foo.appmap.json')`
      ).run();
      const m = appmapRefClause('Friendly Name', 'a');
      const row = db
        .prepare(`SELECT a.name FROM appmaps a WHERE ${m.sql}`)
        .get(...m.params) as { name: string } | undefined;
      expect(row?.name).toBe('Friendly Name');
    } finally {
      db.close();
    }
  });
});

describe('parseClassRef', () => {
  it('short form is just a class', () => {
    expect(parseClassRef('UserRepository')).toEqual({ class: 'UserRepository' });
  });

  it('short form with method via #', () => {
    expect(parseClassRef('UserRepository#findById')).toEqual({
      class: 'UserRepository',
      method: 'findById',
    });
  });

  it('Ruby/C++ "::" chain in short form is kept as one class name', () => {
    expect(parseClassRef('Cls1::Cls2')).toEqual({ class: 'Cls1::Cls2' });
    expect(parseClassRef('OpenSSL::Cipher')).toEqual({ class: 'OpenSSL::Cipher' });
  });

  it('Ruby/C++ "::" chain with method via #', () => {
    expect(parseClassRef('Net::HTTP#get')).toEqual({ class: 'Net::HTTP', method: 'get' });
  });

  it('Java/Python dot-form in short form is kept whole (no method split)', () => {
    // We can't unambiguously split "org.example.Foo" without context; treat
    // the whole input as the class name and let the fallback match it via
    // defined_class.
    expect(parseClassRef('org.example.Foo')).toEqual({ class: 'org.example.Foo' });
  });

  it('canonical fqid: package + class', () => {
    expect(parseClassRef('app/services/UserRepository')).toEqual({
      package: 'app/services',
      class: 'UserRepository',
    });
  });

  it('canonical fqid: package + class + instance method', () => {
    expect(parseClassRef('app/services/UserRepository#findById')).toEqual({
      package: 'app/services',
      class: 'UserRepository',
      method: 'findById',
    });
  });

  it('canonical fqid: package + class + static method', () => {
    expect(parseClassRef('core/date/Date.parse')).toEqual({
      package: 'core/date',
      class: 'Date',
      method: 'parse',
    });
  });

  it('canonical fqid with nested classes via ::', () => {
    expect(parseClassRef('app/Outer::Inner#foo')).toEqual({
      package: 'app',
      class: 'Outer::Inner',
      method: 'foo',
    });
    expect(parseClassRef('lib/Outer::Inner.parse')).toEqual({
      package: 'lib',
      class: 'Outer::Inner',
      method: 'parse',
    });
  });
});

function seedCodeObject(
  db: sqlite3.Database,
  fqid: string,
  pkg: string,
  classes: string[],
  method: string,
  isStatic = 0
): number {
  const leaf = classes.length > 0 ? classes[classes.length - 1] : '';
  db.prepare(
    `INSERT OR IGNORE INTO code_objects (fqid, package, classes, leaf_class, method, is_static)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(fqid, pkg, JSON.stringify(classes), leaf, method, isStatic);
  return (db.prepare(`SELECT id FROM code_objects WHERE fqid = ?`).get(fqid) as { id: number }).id;
}

function seedAppmap(db: sqlite3.Database): number {
  return Number(
    db
      .prepare(`INSERT INTO appmaps (name, source_path) VALUES ('a', '/tmp/a.appmap.json')`)
      .run().lastInsertRowid
  );
}

function seedCall(
  db: sqlite3.Database,
  appmapId: number,
  eventId: number,
  defined_class: string,
  method_id: string,
  code_object_id: number | null
): void {
  db.prepare(
    `INSERT INTO function_calls (appmap_id, event_id, defined_class, method_id, code_object_id)
     VALUES (?, ?, ?, ?, ?)`
  ).run(appmapId, eventId, defined_class, method_id, code_object_id);
}

describe('classFilterClauses', () => {
  it('short class name matches a nested ::-chain via suffix', () => {
    const db = freshDb();
    try {
      const aid = seedAppmap(db);
      const co1 = seedCodeObject(db, 'app/OpenSSL::Cipher#decrypt', 'app', ['OpenSSL', 'Cipher'], 'decrypt');
      const co2 = seedCodeObject(db, 'app/Cipher#decrypt', 'app', ['Cipher'], 'decrypt');
      const co3 = seedCodeObject(db, 'app/Other#m', 'app', ['Other'], 'm');
      seedCall(db, aid, 1, 'OpenSSL::Cipher', 'decrypt', co1);
      seedCall(db, aid, 2, 'Cipher', 'decrypt', co2);
      seedCall(db, aid, 3, 'Other', 'm', co3);

      const c = classFilterClauses('Cipher', 'fc');
      const sql = `SELECT fc.event_id FROM function_calls fc WHERE ${c.where.join(' AND ')} ORDER BY fc.event_id`;
      const eids = (db.prepare(sql).all(...c.params) as { event_id: number }[]).map((r) => r.event_id);
      // Both co1 (nested) and co2 (top-level) should match; co3 should not.
      expect(eids).toEqual([1, 2]);
    } finally {
      db.close();
    }
  });

  it('full canonical fqid matches strictly on all components', () => {
    const db = freshDb();
    try {
      const aid = seedAppmap(db);
      const co1 = seedCodeObject(
        db,
        'org/example/UserRepository#findById',
        'org/example',
        ['UserRepository'],
        'findById'
      );
      const co2 = seedCodeObject(
        db,
        'org/other/UserRepository#findById',
        'org/other',
        ['UserRepository'],
        'findById'
      );
      seedCall(db, aid, 1, 'org.example.UserRepository', 'findById', co1);
      seedCall(db, aid, 2, 'org.other.UserRepository', 'findById', co2);

      const c = classFilterClauses('org/example/UserRepository#findById', 'fc');
      const sql = `SELECT fc.event_id FROM function_calls fc WHERE ${c.where.join(' AND ')}`;
      const eids = (db.prepare(sql).all(...c.params) as { event_id: number }[]).map((r) => r.event_id);
      expect(eids).toEqual([1]);
    } finally {
      db.close();
    }
  });

  it('Ruby short-form matches via defined_class fallback when not linked to a code_object', () => {
    const db = freshDb();
    try {
      const aid = seedAppmap(db);
      // Unlinked call (code_object_id = NULL); defined_class is Ruby-form.
      seedCall(db, aid, 1, 'OpenSSL::Cipher', 'decrypt', null);
      seedCall(db, aid, 2, 'Some::Other::Class', 'm', null);

      const c = classFilterClauses('Cipher', 'fc');
      const sql = `SELECT fc.event_id FROM function_calls fc WHERE ${c.where.join(' AND ')}`;
      const eids = (db.prepare(sql).all(...c.params) as { event_id: number }[]).map((r) => r.event_id);
      expect(eids).toEqual([1]);
    } finally {
      db.close();
    }
  });

  it('Java dot-form input matches the full defined_class on unlinked rows', () => {
    const db = freshDb();
    try {
      const aid = seedAppmap(db);
      seedCall(db, aid, 1, 'org.example.Foo', 'm', null);
      seedCall(db, aid, 2, 'org.example.Bar', 'm', null);

      const c = classFilterClauses('org.example.Foo', 'fc');
      const sql = `SELECT fc.event_id FROM function_calls fc WHERE ${c.where.join(' AND ')}`;
      const eids = (db.prepare(sql).all(...c.params) as { event_id: number }[]).map((r) => r.event_id);
      expect(eids).toEqual([1]);
    } finally {
      db.close();
    }
  });
});

describe('methodFilterClauses', () => {
  it('matches via normalized code_objects.method', () => {
    const db = freshDb();
    try {
      const aid = seedAppmap(db);
      const co1 = seedCodeObject(db, 'app/X#findById', 'app', ['X'], 'findById');
      const co2 = seedCodeObject(db, 'app/Y#save', 'app', ['Y'], 'save');
      seedCall(db, aid, 1, 'X', 'findById', co1);
      seedCall(db, aid, 2, 'Y', 'save', co2);

      const m = methodFilterClauses('findById', 'fc');
      const sql = `SELECT fc.event_id FROM function_calls fc WHERE ${m.where.join(' AND ')}`;
      const eids = (db.prepare(sql).all(...m.params) as { event_id: number }[]).map((r) => r.event_id);
      expect(eids).toEqual([1]);
    } finally {
      db.close();
    }
  });

  it('falls back to function_calls.method_id for unlinked rows', () => {
    const db = freshDb();
    try {
      const aid = seedAppmap(db);
      seedCall(db, aid, 1, 'X', 'findById', null);
      seedCall(db, aid, 2, 'Y', 'save', null);

      const m = methodFilterClauses('findById', 'fc');
      const sql = `SELECT fc.event_id FROM function_calls fc WHERE ${m.where.join(' AND ')}`;
      const eids = (db.prepare(sql).all(...m.params) as { event_id: number }[]).map((r) => r.event_id);
      expect(eids).toEqual([1]);
    } finally {
      db.close();
    }
  });
});
