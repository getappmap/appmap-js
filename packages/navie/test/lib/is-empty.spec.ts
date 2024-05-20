import isEmpty from '../../src/lib/is-empty';

describe('isEmpty', () => {
  it('returns true when expected', () => {
    const examples = [
      null,
      undefined,
      '',
      ['', '', ''],
      { a: null, b: undefined },
      '         ',
      { longEmptyString: ''.repeat(100) },
    ];

    examples.forEach((example) => expect(isEmpty(example, 10)).toBe(true));
  });

  it('returns false when expected', () => {
    const examples = [
      0,
      1,
      'a',
      true,
      false,
      ['a'],
      { a: 1 },
      { b: true },
      { c: false },
      ' a',
      { longString: 'a'.repeat(100) },
    ];

    examples.forEach((example) => expect(isEmpty(example, 10)).toBe(false));
  });

  it('respects maxDepth', () => {
    const examples = [
      { key: [''] },
      { key: { key: [''] } },
      { key: { key: { key: [''] } } },
      { key: { key: { key: { key: [''] } } } },
    ];

    expect(examples.map((e) => isEmpty(e, 3))).toStrictEqual([true, true, false, false]);
  });
});
