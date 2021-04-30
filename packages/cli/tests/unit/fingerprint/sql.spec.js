const { normalizeSQL } = require('@appland/models');

describe('Normalize SQL', () => {
  test('Simple SELECT', () => {
    const sql = 'SELECT * FROM users';
    const result = normalizeSQL(sql);
    expect(result).toEqual({
      action: 'select',
      columns: ['*'],
      tables: ['users'],
    });
  });
  test('Simple INSERT', () => {
    const sql = `INSERT INTO users (login) VALUES ('fred')`;
    const result = normalizeSQL(sql);
    expect(result).toEqual({
      action: 'insert',
      columns: ['login'],
      tables: ['users'],
    });
  });
  test('INSERT RETURNING', () => {
    const sql = `INSERT INTO users (login) VALUES ('fred') RETURNING *`;
    const result = normalizeSQL(sql);
    expect(result).toEqual({
      action: 'insert',
      columns: ['login'],
      tables: ['users'],
    });
  });
  test('Simple UPDATE', () => {
    const sql = `UPDATE users SET login = 'fred'`;
    const result = normalizeSQL(sql);
    expect(result).toEqual({
      action: 'update',
      columns: ['login'],
      tables: ['users'],
    });
  });
});
