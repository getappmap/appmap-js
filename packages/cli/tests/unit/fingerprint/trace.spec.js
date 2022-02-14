const { buildAppMap } = require('@appland/models');
const Trace = require('../../../src/fingerprint/canonicalize/trace');

describe('Trace', () => {
  test('Simple SELECT', () => {
    const result = Trace(
      buildAppMap({
        events: [
          {
            event: 'call',
            sql_query: {
              sql: 'SELECT * FROM users',
            },
          },
        ],
      }).build()
    );
    expect(result).toEqual([
      {
        kind: 'sql',
        sql: {
          normalized_query: 'SELECT * FROM users',
        },
        analyzed_query: {
          actions: ['select'],
          tables: ['users'],
          columns: ['*'],
          joinCount: 0,
        },
      },
    ]);
  });
  test('Unparseable query', () => {
    const result = Trace(
      buildAppMap({
        events: [
          {
            event: 'call',
            sql_query: {
              sql: `u can't parse this`,
            },
          },
        ],
      }).build()
    );
    expect(result).toEqual([
      {
        kind: 'sql',
        sql: {
          normalized_query: `u can't parse this`,
        },
      },
    ]);
  });
});
