import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../../src/cmds/query/db/openQueryDb';
import {
  ClassMapNode,
  importCodeObjects,
} from '../../../../../../src/cmds/query/db/import/codeObjects';

function freshDb(): sqlite3.Database {
  return openQueryDb('/tmp/ignored', ':memory:').db;
}

describe('importCodeObjects', () => {
  it('returns an empty map and writes nothing for an empty classMap', () => {
    const db = freshDb();
    try {
      const lookup = importCodeObjects(db, []);
      expect(lookup.size).toBe(0);
      expect((db.prepare('SELECT COUNT(*) AS n FROM code_objects').get() as any).n).toBe(0);
    } finally {
      db.close();
    }
  });

  it('inserts a single instance method with the canonical fqid', () => {
    const db = freshDb();
    try {
      const tree: ClassMapNode[] = [
        {
          type: 'package',
          name: 'app',
          children: [
            {
              type: 'class',
              name: 'User',
              children: [
                {
                  type: 'function',
                  name: 'save',
                  static: false,
                  location: 'app/models/user.rb:10',
                },
              ],
            },
          ],
        },
      ];
      const lookup = importCodeObjects(db, tree);

      const row = db
        .prepare('SELECT fqid, defined_class, method_id FROM code_objects')
        .get() as any;
      expect(row.fqid).toBe('app/User#save');
      expect(row.method_id).toBe('save');
      expect(row.defined_class).toBe('app.User');
      expect(lookup.get('app/models/user.rb:10')).toBe(1);
    } finally {
      db.close();
    }
  });

  it('uses "." for static methods', () => {
    const db = freshDb();
    try {
      const tree: ClassMapNode[] = [
        {
          type: 'package',
          name: 'core',
          children: [
            {
              type: 'class',
              name: 'Date',
              children: [
                {
                  type: 'function',
                  name: 'parse',
                  static: true,
                  location: 'core/date.rb:1',
                },
              ],
            },
          ],
        },
      ];
      importCodeObjects(db, tree);
      const fqid = (db.prepare('SELECT fqid FROM code_objects').get() as any).fqid;
      expect(fqid).toBe('core/Date.parse');
    } finally {
      db.close();
    }
  });

  it('strips an auxtype suffix from the method name', () => {
    const db = freshDb();
    try {
      const tree: ClassMapNode[] = [
        {
          type: 'package',
          name: 'app',
          children: [
            {
              type: 'class',
              name: 'User',
              children: [
                {
                  type: 'function',
                  name: 'is_authenticated (get)',
                  location: 'app/models/user.rb:1',
                },
              ],
            },
          ],
        },
      ];
      importCodeObjects(db, tree);
      const row = db.prepare('SELECT fqid, method_id FROM code_objects').get() as any;
      expect(row.method_id).toBe('is_authenticated');
      expect(row.fqid).toBe('app/User#is_authenticated');
    } finally {
      db.close();
    }
  });

  it('skips function nodes without a location', () => {
    const db = freshDb();
    try {
      const tree: ClassMapNode[] = [
        {
          type: 'package',
          name: 'lib',
          children: [
            {
              type: 'class',
              name: 'Cipher',
              children: [{ type: 'function', name: 'decrypt' /* no location */ }],
            },
          ],
        },
      ];
      const lookup = importCodeObjects(db, tree);
      expect(lookup.size).toBe(0);
      expect((db.prepare('SELECT COUNT(*) AS n FROM code_objects').get() as any).n).toBe(0);
    } finally {
      db.close();
    }
  });

  it('inserts labels for the function and dedups them', () => {
    const db = freshDb();
    try {
      const tree: ClassMapNode[] = [
        {
          type: 'package',
          name: 'app',
          children: [
            {
              type: 'class',
              name: 'Logger',
              children: [
                {
                  type: 'function',
                  name: 'error',
                  location: 'app/lib/logger.rb:5',
                  labels: ['log', 'log'], // duplicate in source
                },
              ],
            },
          ],
        },
      ];
      importCodeObjects(db, tree);
      const labels = db
        .prepare('SELECT label FROM labels ORDER BY label')
        .all()
        .map((r: any) => r.label);
      expect(labels).toEqual(['log']);
    } finally {
      db.close();
    }
  });

  it('builds nested-package fqids correctly', () => {
    const db = freshDb();
    try {
      const tree: ClassMapNode[] = [
        {
          type: 'package',
          name: 'app',
          children: [
            {
              type: 'package',
              name: 'controllers',
              children: [
                {
                  type: 'package',
                  name: 'orders',
                  children: [
                    {
                      type: 'class',
                      name: 'OrdersController',
                      children: [
                        {
                          type: 'function',
                          name: 'create',
                          location: 'app/controllers/orders/orders_controller.rb:42',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      importCodeObjects(db, tree);
      const fqid = (db.prepare('SELECT fqid FROM code_objects').get() as any).fqid;
      expect(fqid).toBe('app/controllers/orders/OrdersController#create');
    } finally {
      db.close();
    }
  });

  it('uses :: between nested class names (matches @appland/models codeObjectId)', () => {
    const db = freshDb();
    try {
      const tree: ClassMapNode[] = [
        {
          type: 'package',
          name: 'app',
          children: [
            {
              type: 'class',
              name: 'Outer',
              children: [
                {
                  type: 'class',
                  name: 'Inner',
                  children: [
                    { type: 'function', name: 'foo', location: 'app/outer.rb:1' },
                  ],
                },
              ],
            },
          ],
        },
      ];
      importCodeObjects(db, tree);
      const fqid = (db.prepare('SELECT fqid FROM code_objects').get() as any).fqid;
      expect(fqid).toBe('app/Outer::Inner#foo');
    } finally {
      db.close();
    }
  });

  it('uses :: when a class is the immediate child of another class with a static method', () => {
    const db = freshDb();
    try {
      const tree: ClassMapNode[] = [
        {
          type: 'package',
          name: 'lib',
          children: [
            {
              type: 'class',
              name: 'Outer',
              children: [
                {
                  type: 'class',
                  name: 'Inner',
                  children: [
                    { type: 'function', name: 'parse', static: true, location: 'lib/x.rb:1' },
                  ],
                },
              ],
            },
          ],
        },
      ];
      importCodeObjects(db, tree);
      const fqid = (db.prepare('SELECT fqid FROM code_objects').get() as any).fqid;
      expect(fqid).toBe('lib/Outer::Inner.parse');
    } finally {
      db.close();
    }
  });

  it('is idempotent on re-import (INSERT OR IGNORE)', () => {
    const db = freshDb();
    try {
      const tree: ClassMapNode[] = [
        {
          type: 'package',
          name: 'app',
          children: [
            {
              type: 'class',
              name: 'User',
              children: [
                {
                  type: 'function',
                  name: 'save',
                  location: 'app/models/user.rb:10',
                  labels: ['dao'],
                },
              ],
            },
          ],
        },
      ];
      importCodeObjects(db, tree);
      importCodeObjects(db, tree);
      expect((db.prepare('SELECT COUNT(*) AS n FROM code_objects').get() as any).n).toBe(1);
      expect((db.prepare('SELECT COUNT(*) AS n FROM labels').get() as any).n).toBe(1);
    } finally {
      db.close();
    }
  });
});
