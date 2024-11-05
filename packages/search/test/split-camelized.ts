import { splitCamelized } from '../src/split-camelized';

describe('splitCamelized', () => {
  it('should split camelized strings correctly', () => {
    const cases = [
      { text: 'dataForUSACounties', expected: 'data for USA counties' },
      { text: 'myURLstring', expected: 'my URL string' },
      { text: 'simpleTest', expected: 'simple test' },
      { text: 'CAPSTest', expected: 'caps test' },
    ];

    cases.forEach(({ text, expected }) => {
      const result = splitCamelized(text, { separator: ' ', preserveConsecutiveUppercase: true });
      expect(result).toBe(expected);
    });
  });

  it('should handle short strings correctly', () => {
    expect(splitCamelized('A', { separator: '_', preserveConsecutiveUppercase: false })).toBe('a');
    expect(splitCamelized('A', { separator: '-', preserveConsecutiveUppercase: true })).toBe('A');
  });

  it('should respect preserveConsecutiveUppercase flag', () => {
    expect(
      splitCamelized('dataForUSACounties', { separator: ' ', preserveConsecutiveUppercase: false })
    ).toBe('data for usa counties');
    expect(splitCamelized('URLtest', { separator: '_', preserveConsecutiveUppercase: true })).toBe(
      'URL_test'
    );
  });
});
