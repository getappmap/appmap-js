import { validateFlags } from '../../../../../src/cmds/query/verbs/find';

describe('find verb flag validation', () => {
  it('accepts the universal flags on every type', () => {
    const universal = {
      branch: 'main',
      commit: 'abc',
      since: '2026-01-01',
      until: '2026-12-31',
      appmap: 'demo',
      // output flags are also always allowed
      limit: 5,
      offset: 0,
      json: true,
    };
    for (const type of ['appmaps', 'requests', 'queries', 'calls', 'exceptions'] as const) {
      expect(() => validateFlags(type, universal)).not.toThrow();
    }
  });

  it('rejects --class on find appmaps', () => {
    expect(() => validateFlags('appmaps', { class: 'Foo' })).toThrow(/--class/);
    expect(() => validateFlags('appmaps', { class: 'Foo' })).toThrow(/find appmaps/);
  });

  it('accepts --route and --status on find appmaps', () => {
    expect(() => validateFlags('appmaps', { route: '/x', status: '500' })).not.toThrow();
  });

  it('rejects --table on find calls and find exceptions', () => {
    expect(() => validateFlags('calls', { table: 'orders' })).toThrow(/--table/);
    expect(() => validateFlags('exceptions', { table: 'orders' })).toThrow(/--table/);
  });

  it('rejects --exception except on find exceptions', () => {
    expect(() => validateFlags('exceptions', { exception: 'IntegrityError' })).not.toThrow();
    expect(() => validateFlags('calls', { exception: 'IntegrityError' })).toThrow(/--exception/);
    expect(() => validateFlags('queries', { exception: 'IntegrityError' })).toThrow(/--exception/);
  });

  it('rejects --label everywhere except find calls', () => {
    expect(() => validateFlags('calls', { label: 'log' })).not.toThrow();
    expect(() => validateFlags('appmaps', { label: 'log' })).toThrow(/--label/);
    expect(() => validateFlags('requests', { label: 'log' })).toThrow(/--label/);
    expect(() => validateFlags('queries', { label: 'log' })).toThrow(/--label/);
    expect(() => validateFlags('exceptions', { label: 'log' })).toThrow(/--label/);
  });

  it('rejects --duration on appmaps and exceptions', () => {
    expect(() => validateFlags('appmaps', { duration: '>1s' })).toThrow(/--duration/);
    expect(() => validateFlags('exceptions', { duration: '>1s' })).toThrow(/--duration/);
    // calls/queries/requests all accept duration
    expect(() => validateFlags('calls', { duration: '>1s' })).not.toThrow();
    expect(() => validateFlags('queries', { duration: '>1s' })).not.toThrow();
    expect(() => validateFlags('requests', { duration: '>1s' })).not.toThrow();
  });

  it('lists multiple incompatible flags in a single error', () => {
    expect(() =>
      validateFlags('appmaps', { class: 'Foo', table: 'orders' })
    ).toThrow(/--class.*--table|--table.*--class/);
  });

  it('ignores undefined / null flag values', () => {
    expect(() =>
      validateFlags('appmaps', { class: undefined, table: null })
    ).not.toThrow();
  });
});
