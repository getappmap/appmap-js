import { validateFlags } from '../../../../../src/cmds/query/verbs/hotspots';

describe('hotspots verb flag validation', () => {
  it('function-mode accepts --class', () => {
    expect(() => validateFlags('function', { class: 'UserRepository' })).not.toThrow();
  });

  it('sql-mode rejects --class', () => {
    expect(() => validateFlags('sql', { class: 'UserRepository' })).toThrow(
      /--type=sql:.*--class.*not supported/
    );
  });

  it('sql-mode accepts --route, --branch, --since, --until, --limit', () => {
    expect(() =>
      validateFlags('sql', {
        route: '/x',
        branch: 'main',
        since: '2026-01-01',
        until: '2026-12-31',
        limit: 5,
      })
    ).not.toThrow();
  });

  it('ignores undefined / null flag values', () => {
    expect(() => validateFlags('sql', { class: undefined })).not.toThrow();
  });
});
