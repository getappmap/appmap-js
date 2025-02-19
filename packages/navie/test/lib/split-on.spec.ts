import splitOn from '../../src/lib/split-on';

describe('splitOn', () => {
  it('splits on exact match', () => {
    const result = splitOn('abc---def', '---');
    expect(result).toEqual(['abc', '---', 'def']);
  });

  it('splits on partial match at suffix', () => {
    const result = splitOn('abc--', '---');
    expect(result).toEqual(['abc', '--', '']);
  });

  it('splits when needle is not found', () => {
    const result = splitOn('abc', '---');
    expect(result).toEqual(['abc', '', '']);
  });

  it('splits on first occurrence of needle', () => {
    const result = splitOn('abc---def---ghi', '---');
    expect(result).toEqual(['abc', '---', 'def---ghi']);
  });

  it('splits on match within string', () => {
    const result = splitOn('abc---def---ghi', '--');
    expect(result).toEqual(['abc', '--', '-def---ghi']);
  });

  it('returns entire string if needle is not found', () => {
    const result = splitOn('abc-def-ghi', '---');
    expect(result).toEqual(['abc-def-ghi', '', '']);
  });

  it('splits on exact match within string', () => {
    const result = splitOn('abc-def-ghi', 'def');
    expect(result).toEqual(['abc-', 'def', '-ghi']);
  });

  it('splits on regex match', () => {
    const result = splitOn('abc-def-ghi', /-[def]+-/);
    expect(result).toEqual(['abc', '-def-', 'ghi']);
  });

  it('splits on partial regex match', () => {
    const result = splitOn('abc-de', /-.*-/);
    expect(result).toEqual(['abc', '-de', '']);
  });
});
