const { buildAppMap } = require('@appland/models');
const SQLTables = require('../../../src/fingerprint/canonicalize/sqlTables');

describe('sqlTables', () => {
  test('Simple SELECT', () => {
    const result = SQLTables(
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
    expect(result).toEqual(['users']);
  });
  test('Unparseable query', () => {
    const result = SQLTables(
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
    expect(result).toEqual([]);
  });
});
