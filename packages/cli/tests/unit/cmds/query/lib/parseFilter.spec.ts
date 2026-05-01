import {
  numberFilterSql,
  parseDuration,
  parseStatus,
  parseTime,
} from '../../../../../src/cmds/query/lib/parseFilter';

describe('parseStatus', () => {
  it('parses bare integer as equality', () => {
    expect(parseStatus('500')).toEqual({ op: '=', value: 500 });
  });

  it('parses each comparator', () => {
    expect(parseStatus('>=500')).toEqual({ op: '>=', value: 500 });
    expect(parseStatus('<=399')).toEqual({ op: '<=', value: 399 });
    expect(parseStatus('>200')).toEqual({ op: '>', value: 200 });
    expect(parseStatus('<400')).toEqual({ op: '<', value: 400 });
    expect(parseStatus('=500')).toEqual({ op: '=', value: 500 });
  });

  it('tolerates whitespace around the operator', () => {
    expect(parseStatus('>= 500')).toEqual({ op: '>=', value: 500 });
    expect(parseStatus(' >=500 ')).toEqual({ op: '>=', value: 500 });
  });

  it('throws on garbage input', () => {
    expect(() => parseStatus('5xx')).toThrow(/invalid/);
    expect(() => parseStatus('')).toThrow(/invalid/);
  });
});

describe('parseDuration', () => {
  it('defaults to ms when no unit is given', () => {
    expect(parseDuration('>500')).toEqual({ op: '>', value: 500 });
  });

  it('converts s/m/h to ms', () => {
    expect(parseDuration('>1s')).toEqual({ op: '>', value: 1000 });
    expect(parseDuration('>=2m')).toEqual({ op: '>=', value: 120_000 });
    expect(parseDuration('<1h')).toEqual({ op: '<', value: 3_600_000 });
  });

  it('accepts decimals', () => {
    expect(parseDuration('>1.5s')).toEqual({ op: '>', value: 1500 });
  });
});

describe('parseTime', () => {
  it('parses ISO timestamps', () => {
    expect(parseTime('2026-04-29T14:21:08Z')).toBe('2026-04-29T14:21:08.000Z');
  });

  it('parses ISO dates', () => {
    expect(parseTime('2026-04-29')).toBe('2026-04-29T00:00:00.000Z');
  });

  it('parses relative offsets', () => {
    const now = new Date('2026-05-01T12:00:00Z');
    expect(parseTime('7d ago', now)).toBe('2026-04-24T12:00:00.000Z');
    expect(parseTime('30m ago', now)).toBe('2026-05-01T11:30:00.000Z');
    expect(parseTime('2h ago', now)).toBe('2026-05-01T10:00:00.000Z');
    expect(parseTime('45s ago', now)).toBe('2026-05-01T11:59:15.000Z');
  });

  it('throws on garbage input', () => {
    expect(() => parseTime('not a time')).toThrow(/invalid/);
  });
});

describe('numberFilterSql', () => {
  it('builds a sql fragment + value', () => {
    expect(numberFilterSql('status_code', { op: '>=', value: 500 })).toEqual({
      sql: 'status_code >= ?',
      value: 500,
    });
  });
});
