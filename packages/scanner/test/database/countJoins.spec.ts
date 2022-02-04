import { parseSQL } from '@appland/models';
import { countJoins } from '../../src/database';

describe('Count joins', () => {
  it('Simple SELECT', async () => {
    const sql = `SELECT users.*, a.* FROM users`;
    expect(countJoins(parseSQL(sql))).toEqual(0);
  });

  it('SELECT with JOIN', async () => {
    const sql = `SELECT users.*, a.* FROM users JOIN addresses a ON a.user_id = users.id`;
    expect(countJoins(parseSQL(sql))).toEqual(1);
  });

  it('SELECT with multiple tables in FROM and JOIN', async () => {
    const sql = `SELECT users.*, a.* FROM users, payments JOIN addresses a ON a.user_id = users.id`;
    expect(countJoins(parseSQL(sql))).toEqual(2);
  });

  it('SELECT with self join', async () => {
    const sql = `SELECT u1.* FROM users u1 JOIN users u2 ON u1.admin_id = u2.id`;
    expect(countJoins(parseSQL(sql))).toEqual(1);
  });

  it('SELECT with sub-query', async () => {
    const sql = `SELECT * FROM users WHERE id IN (SELECT id FROM ids)`;
    expect(countJoins(parseSQL(sql))).toEqual(0);
  });

  it('SELECT with LEFT JOIN', async () => {
    const sql = `SELECT u1.* FROM users u1 LEFT JOIN users u2 ON u1.admin_id = u2.id`;
    expect(countJoins(parseSQL(sql))).toEqual(1);
  });

  it('SELECT with RIGHT JOIN', async () => {
    const sql = `SELECT u1.* FROM users u1 RIGHT JOIN users u2 ON u1.admin_id = u2.id`;
    expect(countJoins(parseSQL(sql))).toEqual(1);
  });

  it('SELECT with INNER JOIN', async () => {
    const sql = `SELECT u1.* FROM users u1 INNER JOIN users u2 ON u1.admin_id = u2.id`;
    expect(countJoins(parseSQL(sql))).toEqual(1);
  });

  it('SELECT with FULL OUTER JOIN', async () => {
    const sql = `SELECT u1.* FROM users u1 FULL OUTER JOIN users u2 ON u1.admin_id = u2.id`;
    expect(countJoins(parseSQL(sql))).toEqual(1);
  });
});
