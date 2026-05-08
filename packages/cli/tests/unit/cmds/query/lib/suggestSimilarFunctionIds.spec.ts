import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import { suggestSimilarFunctionIds } from '../../../../../src/cmds/query/lib/suggestSimilarFunctionIds';

function freshDb(): sqlite3.Database {
  return openQueryDb('/tmp/ignored', ':memory:').db;
}

interface SeededFn {
  fqid: string;
  package: string;
  classes: string;
  leaf_class: string;
  method: string;
  calls: number;
}

function seed(db: sqlite3.Database, fns: SeededFn[]): void {
  // One appmap so function_calls have an FK target.
  const am = db
    .prepare(
      `INSERT INTO appmaps (name, source_path) VALUES ('rec', '/tmp/rec.appmap.json')`
    )
    .run();
  const amid = am.lastInsertRowid;
  const insCo = db.prepare(
    `INSERT INTO code_objects (fqid, package, classes, leaf_class, method, is_static)
     VALUES (?, ?, ?, ?, ?, 0)`
  );
  const insFc = db.prepare(
    `INSERT INTO function_calls (appmap_id, event_id, code_object_id, defined_class, method_id)
     VALUES (?, ?, ?, ?, ?)`
  );
  let nextEventId = 1;
  for (const fn of fns) {
    const co = insCo.run(fn.fqid, fn.package, fn.classes, fn.leaf_class, fn.method);
    const coId = co.lastInsertRowid;
    for (let i = 0; i < fn.calls; i++) {
      insFc.run(amid, nextEventId++, coId, fn.leaf_class, fn.method);
    }
  }
}

describe('suggestSimilarFunctionIds', () => {
  it('detects interface vs Impl when only the Impl fired', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          fqid: 'app/PaymentServiceImpl#submit',
          package: 'app',
          classes: '["PaymentServiceImpl"]',
          leaf_class: 'PaymentServiceImpl',
          method: 'submit',
          calls: 12,
        },
        {
          fqid: 'app/UserRepository#findById',
          package: 'app',
          classes: '["UserRepository"]',
          leaf_class: 'UserRepository',
          method: 'findById',
          calls: 4,
        },
      ]);
      const result = suggestSimilarFunctionIds(db, 'PaymentService', 'submit');
      expect(result.did_you_mean[0].function_id).toBe('app/PaymentServiceImpl#submit');
      expect(result.did_you_mean[0].calls).toBe(12);
      expect(result.hint).toMatch(/interface/i);
      expect(result.hint).toMatch(/PaymentServiceImpl/);
    } finally {
      db.close();
    }
  });

  it('returns "no possible reasons" hint when nothing is close', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          fqid: 'app/UserRepository#findById',
          package: 'app',
          classes: '["UserRepository"]',
          leaf_class: 'UserRepository',
          method: 'findById',
          calls: 1,
        },
      ]);
      const result = suggestSimilarFunctionIds(db, 'TotallyUnrelated', 'thing');
      expect(result.hint).toMatch(/Possible reasons/i);
      expect(result.hint).toMatch(/coverage/);
    } finally {
      db.close();
    }
  });

  it('marks in_index=false for code_objects that never fired', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          fqid: 'app/Foo#bar',
          package: 'app',
          classes: '["Foo"]',
          leaf_class: 'Foo',
          method: 'bar',
          calls: 0,
        },
      ]);
      const result = suggestSimilarFunctionIds(db, 'Foo', 'bar');
      expect(result.did_you_mean[0]).toEqual({
        function_id: 'app/Foo#bar',
        calls: 0,
        in_index: false,
      });
    } finally {
      db.close();
    }
  });

  it('hints about dot-vs-slash when probe uses Java-style dots', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          fqid: 'app/services/Payment#submit',
          package: 'app/services',
          classes: '["Payment"]',
          leaf_class: 'Payment',
          method: 'submit',
          calls: 3,
        },
      ]);
      const result = suggestSimilarFunctionIds(db, 'app.services.Payment', 'submit');
      expect(result.hint).toMatch(/slash/i);
    } finally {
      db.close();
    }
  });

  it('caps suggestions at 5', () => {
    const db = freshDb();
    try {
      const fns: SeededFn[] = [];
      for (let i = 0; i < 12; i++) {
        fns.push({
          fqid: `app/Payment${i}#submit`,
          package: 'app',
          classes: `["Payment${i}"]`,
          leaf_class: `Payment${i}`,
          method: 'submit',
          calls: 1,
        });
      }
      seed(db, fns);
      const result = suggestSimilarFunctionIds(db, 'Payment', 'submit');
      expect(result.did_you_mean.length).toBeLessThanOrEqual(5);
    } finally {
      db.close();
    }
  });
});
