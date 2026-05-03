import {
  buildFindFilter,
  projectLogMessage,
  validateFlags,
} from '../../../../../src/cmds/query/verbs/find';

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
    for (const type of ['appmaps', 'requests', 'queries', 'calls', 'exceptions', 'logs'] as const) {
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

  it('rejects --duration on exceptions; accepts elsewhere', () => {
    expect(() => validateFlags('exceptions', { duration: '>1s' })).toThrow(/--duration/);
    // appmaps (recording-level), calls, queries, requests all accept duration
    expect(() => validateFlags('appmaps', { duration: '>1s' })).not.toThrow();
    expect(() => validateFlags('calls', { duration: '>1s' })).not.toThrow();
    expect(() => validateFlags('queries', { duration: '>1s' })).not.toThrow();
    expect(() => validateFlags('requests', { duration: '>1s' })).not.toThrow();
  });

  it('hint message guides --method users on find requests', () => {
    expect(() => validateFlags('requests', { method: 'findById' })).toThrow(
      /--route/
    );
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

  it('logs accepts --logger and --message; rejects --class with a hint', () => {
    expect(() => validateFlags('logs', { logger: 'AppLogger' })).not.toThrow();
    expect(() => validateFlags('logs', { message: 'connection refused' })).not.toThrow();
    expect(() => validateFlags('logs', { class: 'AppLogger' })).toThrow(/--logger/);
    expect(() => validateFlags('logs', { label: 'log' })).toThrow(/implied/);
  });

  it('logs rejects row-level filters that don\'t apply', () => {
    expect(() => validateFlags('logs', { route: '/x' })).toThrow(/--route/);
    expect(() => validateFlags('logs', { status: '500' })).toThrow(/--status/);
    expect(() => validateFlags('logs', { duration: '>1s' })).toThrow(/--duration/);
    expect(() => validateFlags('logs', { table: 'users' })).toThrow(/--table/);
    expect(() => validateFlags('logs', { exception: 'X' })).toThrow(/--exception/);
  });

  it('--logger and --message are rejected on non-logs types', () => {
    for (const type of ['appmaps', 'requests', 'queries', 'calls', 'exceptions'] as const) {
      expect(() => validateFlags(type, { logger: 'X' })).toThrow(/--logger/);
      expect(() => validateFlags(type, { message: 'x' })).toThrow(/--message/);
    }
  });

  it('--with-logs is accepted only on find exceptions', () => {
    expect(() => validateFlags('exceptions', { 'with-logs': 5 })).not.toThrow();
    for (const type of ['appmaps', 'requests', 'queries', 'calls', 'logs'] as const) {
      expect(() => validateFlags(type, { 'with-logs': 5 })).toThrow(/--with-logs/);
    }
  });
});

describe('buildFindFilter', () => {
  it('splits Class#method off of --class so the method composes via filter.method', () => {
    const { filter } = buildFindFilter({
      type: 'queries',
      class: 'org.example.UserRepo#findById',
    });
    expect(filter.className).toBe('org.example.UserRepo#findById');
    expect(filter.method).toBe('findById');
  });

  it('explicit --method wins over a method embedded in --class', () => {
    const { filter } = buildFindFilter({
      type: 'calls',
      class: 'X#fromClass',
      method: 'fromMethod',
    });
    expect(filter.method).toBe('fromMethod');
  });

  it('--class without # leaves filter.method undefined', () => {
    const { filter } = buildFindFilter({
      type: 'calls',
      class: 'OpenSSL::Cipher',
    });
    expect(filter.className).toBe('OpenSSL::Cipher');
    expect(filter.method).toBeUndefined();
  });

  it('returns the parsed type', () => {
    expect(buildFindFilter({ type: 'appmaps' }).type).toBe('appmaps');
  });

  it('plumbs --with-logs into filter.withLogs from either kebab or camel keys', () => {
    expect(buildFindFilter({ type: 'exceptions', withLogs: 5 }).filter.withLogs).toBe(5);
    expect(buildFindFilter({ type: 'exceptions', 'with-logs': 7 }).filter.withLogs).toBe(7);
    expect(buildFindFilter({ type: 'exceptions' }).filter.withLogs).toBeUndefined();
  });

  it('plumbs --logger and --message into the filter for logs', () => {
    const { type, filter } = buildFindFilter({
      type: 'logs',
      logger: 'AppLogger',
      message: 'connection refused',
    });
    expect(type).toBe('logs');
    expect(filter.logger).toBe('AppLogger');
    expect(filter.message).toBe('connection refused');
  });
});

describe('projectLogMessage', () => {
  it('prefers a structured-return message field when return_value is JSON', () => {
    const r = JSON.stringify({ level: 'info', message: 'hello world' });
    expect(projectLogMessage(null, r)).toBe('hello world');
  });

  it('uses a parameter named message when return_value lacks a structured message', () => {
    const params = JSON.stringify([
      { name: 'tag', class: 'String', value: 'auth' },
      { name: 'message', class: 'String', value: 'login ok' },
    ]);
    expect(projectLogMessage(params, null)).toBe('login ok');
  });

  it('accepts msg as an alias for message', () => {
    const params = JSON.stringify([{ name: 'msg', class: 'String', value: 'queued' }]);
    expect(projectLogMessage(params, null)).toBe('queued');
  });

  it('falls back to the first string-typed parameter value', () => {
    const params = JSON.stringify([
      { name: 'count', class: 'Integer', value: 5 },
      { name: 'note', class: 'String', value: 'first text' },
    ]);
    expect(projectLogMessage(params, null)).toBe('first text');
  });

  it('returns a non-empty repr even when nothing matches', () => {
    const params = JSON.stringify([{ name: 'count', class: 'Integer', value: 5 }]);
    expect(projectLogMessage(params, null)).toBe('[5]');
  });

  it('returns an empty string when both inputs are null', () => {
    expect(projectLogMessage(null, null)).toBe('');
  });

  it('return_value that is not JSON is treated as opaque (not the message)', () => {
    // Falls through to parameters_json; if that's null, returns ''.
    expect(projectLogMessage(null, 'true')).toBe('');
  });
});
