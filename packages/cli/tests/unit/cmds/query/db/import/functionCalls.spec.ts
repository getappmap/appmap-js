import {
  importCodeObjects,
  ClassMapNode,
} from '../../../../../../src/cmds/query/db/import/codeObjects';
import { importFunctionCalls } from '../../../../../../src/cmds/query/db/import/functionCalls';
import { buildReturnEventMap } from '../../../../../../src/cmds/query/db/import/returnEventMap';
import { buildParentEventMap } from '../../../../../../src/cmds/query/db/import/parentEventMap';
import { freshDb } from './helpers';

function seedAppmap(db: any): number {
  const info = db
    .prepare("INSERT INTO appmaps (name, source_path) VALUES ('rec', '/tmp/rec.appmap.json')")
    .run();
  return Number(info.lastInsertRowid);
}

describe('importFunctionCalls', () => {
  it('inserts call events, links code_object via path:lineno, and records elapsed', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const classMap: ClassMapNode[] = [
        {
          type: 'package',
          name: 'app',
          children: [
            {
              type: 'class',
              name: 'User',
              children: [
                { type: 'function', name: 'save', location: 'app/models/user.rb:10' },
              ],
            },
          ],
        },
      ];
      const lookup = importCodeObjects(db, classMap);
      const events = [
        {
          id: 1,
          event: 'call',
          thread_id: 1,
          defined_class: 'User',
          method_id: 'save',
          path: 'app/models/user.rb',
          lineno: 10,
        },
        { id: 2, event: 'return', parent_id: 1, elapsed: 0.001 },
      ];
      importFunctionCalls(
        db,
        appmapId,
        events,
        buildReturnEventMap(events),
        buildParentEventMap(events),
        lookup
      );
      const row = db.prepare('SELECT * FROM function_calls').get() as any;
      expect(row.code_object_id).toBe(1);
      expect(row.defined_class).toBe('User');
      expect(row.method_id).toBe('save');
      expect(row.path).toBe('app/models/user.rb');
      expect(row.lineno).toBe(10);
      expect(row.elapsed_ms).toBeCloseTo(1);
      expect(row.parameters_json).toBeNull();
      expect(row.return_value).toBeNull();
    } finally {
      db.close();
    }
  });

  it('captures parameters and return value for a labeled function', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const classMap: ClassMapNode[] = [
        {
          type: 'package',
          name: 'app',
          children: [
            {
              type: 'class',
              name: 'IdempotencyKey',
              children: [
                {
                  type: 'function',
                  name: 'generate',
                  static: true,
                  location: 'app/services/idempotency.rb:12',
                  labels: ['security.idempotency'],
                },
              ],
            },
          ],
        },
      ];
      const lookup = importCodeObjects(db, classMap);
      const events = [
        {
          id: 1,
          event: 'call',
          thread_id: 1,
          defined_class: 'IdempotencyKey',
          method_id: 'generate',
          path: 'app/services/idempotency.rb',
          lineno: 12,
          static: true,
          parameters: [{ name: 'request_id', class: 'String', value: "'req-9281'" }],
        },
        {
          id: 2,
          event: 'return',
          parent_id: 1,
          return_value: { class: 'String', value: "'k-9281'" },
        },
      ];
      importFunctionCalls(
        db,
        appmapId,
        events,
        buildReturnEventMap(events),
        buildParentEventMap(events),
        lookup
      );
      const row = db.prepare('SELECT * FROM function_calls').get() as any;
      expect(JSON.parse(row.parameters_json)).toEqual([
        { name: 'request_id', class: 'String', value: "'req-9281'" },
      ]);
      expect(row.return_value).toBe("'k-9281'");
      expect(row.is_static).toBe(1);
    } finally {
      db.close();
    }
  });

  it('captures parameters for an unlabeled function (no label gating)', () => {
    // Regression: parameter capture used to be gated on the code object
    // carrying a label. A void domain method on an unlabeled class then
    // had *both* parameters_json and return_value null — fully opaque.
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      // No classMap → coId stays null → the call is unlabeled.
      const events = [
        {
          id: 1,
          event: 'call',
          thread_id: 1,
          defined_class: 'SyndicationCloseStore',
          method_id: 'updateStatus',
          path: 'lending/SyndicationCloseStore.java',
          lineno: 55,
          parameters: [
            { name: 'loanId', class: 'LoanId', value: 'LOAN-4c26df4c' },
            { name: 'newStatus', class: 'Status', value: 'PREFLIGHT_OK' },
          ],
        },
        // Void method: the return event carries no return_value.
        { id: 2, event: 'return', parent_id: 1, elapsed: 0.001 },
      ];
      importFunctionCalls(
        db,
        appmapId,
        events,
        buildReturnEventMap(events),
        buildParentEventMap(events),
        new Map()
      );
      const row = db.prepare('SELECT * FROM function_calls').get() as any;
      expect(row.code_object_id).toBeNull();
      expect(JSON.parse(row.parameters_json)).toEqual([
        { name: 'loanId', class: 'LoanId', value: 'LOAN-4c26df4c' },
        { name: 'newStatus', class: 'Status', value: 'PREFLIGHT_OK' },
      ]);
      expect(row.return_value).toBeNull();
    } finally {
      db.close();
    }
  });

  it('skips calls that are http_server_request or sql_query carriers', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        {
          id: 1,
          event: 'call',
          defined_class: 'Foo',
          method_id: 'bar',
          http_server_request: { request_method: 'GET', path_info: '/x' },
        },
        {
          id: 2,
          event: 'call',
          defined_class: 'Foo',
          method_id: 'bar',
          sql_query: { sql: 'SELECT 1' },
        },
        {
          id: 3,
          event: 'call',
          defined_class: 'Foo',
          method_id: 'bar',
        },
      ];
      importFunctionCalls(
        db,
        appmapId,
        events,
        buildReturnEventMap(events),
        buildParentEventMap(events),
        new Map()
      );
      expect((db.prepare('SELECT COUNT(*) AS n FROM function_calls').get() as any).n).toBe(1);
      const row = db.prepare('SELECT event_id FROM function_calls').get() as any;
      expect(row.event_id).toBe(3);
    } finally {
      db.close();
    }
  });

  it('leaves code_object_id null when path:lineno does not match any classMap location', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        {
          id: 1,
          event: 'call',
          defined_class: 'Foo',
          method_id: 'bar',
          path: 'unknown.rb',
          lineno: 1,
        },
      ];
      importFunctionCalls(
        db,
        appmapId,
        events,
        buildReturnEventMap(events),
        buildParentEventMap(events),
        new Map()
      );
      const row = db.prepare('SELECT code_object_id FROM function_calls').get() as any;
      expect(row.code_object_id).toBeNull();
    } finally {
      db.close();
    }
  });
});
