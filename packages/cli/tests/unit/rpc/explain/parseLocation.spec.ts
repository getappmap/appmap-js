import parseLocation from '../../../../src/rpc/explain/parseLocation';

describe('parseLocation', () => {
  it('parses a location', () => {
    expect(parseLocation('file.js:123')).toEqual(['file.js', 123]);
  });

  it('parses a location without a line number', () => {
    expect(parseLocation('file.js')).toEqual(['file.js', undefined]);
  });

  it('returns undefined for an invalid location', () => {
    expect(parseLocation('OpenSSL::random')).toBeUndefined();
    expect(parseLocation('file.js:')).toBeUndefined();
  });

  it('ignores line number if negative', () => {
    expect(parseLocation('file.js:-123')).toEqual(['file.js', undefined]);
  });
});
