const { analyzeSQL } = require('@appland/models');

describe('Normalize SQL', () => {
  test('Simple SELECT', () => {
    const sql = 'SELECT * FROM users';
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['*'],
      tables: ['users'],
      joinCount: 0,
    });
  });
  test('Simple INSERT', () => {
    const sql = `INSERT INTO users (login) VALUES ('fred')`;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['insert'],
      columns: ['login'],
      tables: ['users'],
      joinCount: 0,
    });
  });
  test('INSERT RETURNING', () => {
    const sql = `INSERT INTO users (login) VALUES ('fred') RETURNING *`;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['insert'],
      columns: ['login'],
      joinCount: 0,
      tables: ['users'],
    });
  });
  test('Simple UPDATE', () => {
    const sql = `UPDATE users SET login = 'fred'`;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['update'],
      columns: ['login'],
      joinCount: 0,
      tables: ['users'],
    });
  });
  test('SELECT with JOIN', () => {
    const sql = `SELECT users.*, a.* FROM users JOIN addresses a ON a.user_id = users.id`;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['a.*', 'a.user_id', 'users.*', 'users.id'],
      joinCount: 1,
      tables: ['addresses', 'users'],
    });
  });

  test('SELECT with multiple tables in FROM and JOIN', () => {
    const sql = `SELECT users.*, a.* FROM users, payments JOIN addresses a ON a.user_id = users.id`;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['a.*', 'a.user_id', 'users.*', 'users.id'],
      joinCount: 2,
      tables: ['addresses', 'payments', 'users'],
    });
  });

  test('SELECT with self join', () => {
    const sql = `SELECT u1.* FROM users u1 JOIN users u2 ON u1.admin_id = u2.id`;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['u1.*', 'u1.admin_id', 'u2.id'],
      joinCount: 1,
      tables: ['users'],
    });
  });

  test('SELECT with sub-query', () => {
    const sql = `SELECT * FROM users WHERE id IN (SELECT id FROM ids)`;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['*', 'id'],
      joinCount: 0,
      tables: ['ids', 'users'],
    });
  });

  test('SELECT with LEFT JOIN', () => {
    const sql = `SELECT u1.* FROM users u1 LEFT JOIN users u2 ON u1.admin_id = u2.id`;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['u1.*', 'u1.admin_id', 'u2.id'],
      joinCount: 1,
      tables: ['users'],
    });
  });

  test('SELECT with RIGHT JOIN', () => {
    const sql = `SELECT u1.* FROM users u1 RIGHT JOIN users u2 ON u1.admin_id = u2.id`;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['u1.*', 'u1.admin_id', 'u2.id'],
      joinCount: 1,
      tables: ['users'],
    });
  });

  test('SELECT with INNER JOIN', () => {
    const sql = `SELECT u1.* FROM users u1 INNER JOIN users u2 ON u1.admin_id = u2.id`;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['u1.*', 'u1.admin_id', 'u2.id'],
      joinCount: 1,
      tables: ['users'],
    });
  });

  test('SELECT with FULL OUTER JOIN', () => {
    const sql = `SELECT u1.* FROM users u1 FULL OUTER JOIN users u2 ON u1.admin_id = u2.id`;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['u1.*', 'u1.admin_id', 'u2.id'],
      joinCount: 1,
      tables: ['users'],
    });
  });

  test('Query with backticks', () => {
    const sql = `SELECT \`Album\`.\`Title\`
                 FROM \`Album\` AS \`Album\`
                 GROUP BY \`Album\`.\`Title\``;
    const result = analyzeSQL(sql);
    expect(result).toEqual({
      actions: ['select'],
      columns: ['Album.Title'],
      joinCount: 0,
      tables: ['Album'],
    });
  });
});
