const { normalizeSQL } = require('@appland/models');

describe('Normalize SQL', () => {
  test('Simple SELECT', () => {
    const sql = 'SELECT * FROM users';
    const result = normalizeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['*'],
      tables: ['users'],
      joinsCount: 0,
    });
  });
  test('Simple INSERT', () => {
    const sql = `INSERT INTO users (login) VALUES ('fred')`;
    const result = normalizeSQL(sql);
    expect(result).toEqual({
      actions: ['insert'],
      columns: ['login'],
      tables: ['users'],
      joinsCount: 0,
    });
  });
  test('INSERT RETURNING', () => {
    const sql = `INSERT INTO users (login) VALUES ('fred') RETURNING *`;
    const result = normalizeSQL(sql);
    expect(result).toEqual({
      actions: ['insert'],
      columns: ['login'],
      joinsCount: 0,
      tables: ['users'],
    });
  });
  test('Simple UPDATE', () => {
    const sql = `UPDATE users SET login = 'fred'`;
    const result = normalizeSQL(sql);
    expect(result).toEqual({
      actions: ['update'],
      columns: ['login'],
      joinsCount: 0,
      tables: ['users'],
    });
  });
  test('SELECT with JOIN', () => {
    const sql = `SELECT users.*, a.* FROM users JOIN addresses a ON a.user_id = users.id`;
    const result = normalizeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['a.*', 'a.user_id', 'users.*', 'users.id'],
      joinsCount: 1,
      tables: ['addresses', 'users'],
    });
  });

  test('SELECT with multiple tables in FROM and JOIN', () => {
    const sql = `SELECT users.*, a.* FROM users, payments JOIN addresses a ON a.user_id = users.id`;
    const result = normalizeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['a.*', 'a.user_id', 'users.*', 'users.id'],
      joinsCount: 2,
      tables: ['addresses', 'payments', 'users'],
    });
  });
});
