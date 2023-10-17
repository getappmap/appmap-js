import helpers from '../../../src/cmds/compare-report/helpers';

describe('pluralize', () => {
  const pluralize = (helpers as any).pluralize;

  it('builds the plural form when count is 0', () => expect(pluralize(0, 'test')).toEqual('tests'));
  it('uses the plural form when count is 0', () =>
    expect(pluralize(0, 'ox', 'oxen')).toEqual('oxen'));
  it('returns the singular form when count is 1', () =>
    expect(pluralize(1, 'test')).toEqual('test'));
  it('returns the singular form when count is 1', () =>
    expect(pluralize(1, 'test', 'oxen')).toEqual('test'));
  it('builds the plural form when count is 2', () => expect(pluralize(0, 'test')).toEqual('tests'));
  it('uses the plural form when count is 2', () =>
    expect(pluralize(0, 'deer', 'deer')).toEqual('deer'));
  it(`ignores the 'plural' argument if it's an object`, () =>
    expect(pluralize(0, 'test', {})).toEqual('tests'));
  it(`ignores the 'plural' argument if it's a function`, () =>
    expect(pluralize(0, 'test', () => true)).toEqual('tests'));
});
