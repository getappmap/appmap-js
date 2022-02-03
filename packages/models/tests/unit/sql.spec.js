import analyze from '../../src/sql/analyze';
import normalize from '../../src/sql/normalize';
import parse from '../../src/sql/parse';

describe('parse SQL', () => {
  test('produces a parse tree', () => {
    expect(
      parse(
        `SELECT users.*, a.* FROM users JOIN addresses a ON a.user_id = users.id`
      )
    ).toEqual({
      type: 'statement',
      variant: 'list',
      statement: [
        {
          type: 'statement',
          variant: 'select',
          result: [
            { type: 'identifier', variant: 'star', name: 'users.*' },
            { type: 'identifier', variant: 'star', name: 'a.*' },
          ],
          from: {
            type: 'map',
            variant: 'join',
            source: { type: 'identifier', variant: 'table', name: 'users' },
            map: [
              {
                type: 'join',
                variant: 'join',
                source: {
                  type: 'identifier',
                  variant: 'table',
                  name: 'addresses',
                  alias: 'a',
                },
                constraint: {
                  type: 'constraint',
                  variant: 'join',
                  format: 'on',
                  on: {
                    type: 'expression',
                    format: 'binary',
                    variant: 'operation',
                    operation: '=',
                    left: {
                      type: 'identifier',
                      variant: 'column',
                      name: 'a.user_id',
                    },
                    right: {
                      type: 'identifier',
                      variant: 'column',
                      name: 'users.id',
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    });
  });

  test('reports a parse error', () => {
    let err;
    expect(
      parse(
        `SELECT users.*, a.* JOIN addresses a ON a.user_id = users.id`,
        (error) => {
          err = error;
        }
      )
    ).toBeNull();
    expect(err).toEqual(`Syntax error found near Star (SELECT Results Clause)`);
  });
});

describe('normalize SQL', () => {
  test('removes literals', () => {
    expect(
      normalize(`SELECT users.*, a.* FROM users WHERE a.user_id = 'alice'`)
    ).toEqual(`SELECT users.*, a.* FROM users WHERE a.user_id = ?`);
  });
});

describe('analyze SQL', () => {
  test('extracts key SQL features', () => {
    expect(
      analyze(
        `SELECT users.*, a.* FROM users JOIN addresses a ON a.user_id = ?`
      )
    ).toEqual({
      actions: ['select'],
      columns: ['a.*', 'a.user_id', 'users.*'],
      joinCount: 1,
      tables: ['addresses', 'users'],
    });
  });
});
