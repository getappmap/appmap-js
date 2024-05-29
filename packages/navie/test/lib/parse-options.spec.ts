import parseOptions from '../../src/lib/parse-options';

describe('parseOptions', () => {
  it(`interprets a no-arg option as 'true'`, () => {
    const { options, question } = parseOptions('/verbose');
    expect(options.isEnabled('verbose', undefined)).toBe(true);
    expect(question).toBe('');
  });

  it(`interprets 'true' as true`, () => {
    const { options, question } = parseOptions('/verbose=true');
    expect(options.isEnabled('verbose')).toBe(true);
    expect(question).toBe('');
  });

  it(`returns the default boolean value if the option isn't present`, () => {
    const { options, question } = parseOptions('');
    expect(options.isEnabled('verbose', false)).toBe(false);
    expect(question).toBe('');
  });

  it(`returns the default string value if the option isn't present`, () => {
    const { options, question } = parseOptions('');
    expect(options.stringValue('verbose', 'default')).toBe('default');
    expect(question).toBe('');
  });

  it('interprets "yes" as true', () => {
    const { options, question } = parseOptions('/verbose=yes');
    expect(options.isEnabled('verbose')).toBe(true);
    expect(question).toBe('');
  });

  it('interprets "on" as true', () => {
    const { options, question } = parseOptions('/verbose=on');
    expect(options.isEnabled('verbose')).toBe(true);
    expect(question).toBe('');
  });

  it(`interprets 'false' as false`, () => {
    const { options, question } = parseOptions('/verbose=false');
    expect(options.isEnabled('verbose')).toBe(false);
    expect(question).toBe('');
  });

  it('interprets "no" as false', () => {
    const { options, question } = parseOptions('/verbose=no');
    expect(options.isEnabled('verbose')).toBe(false);
    expect(question).toBe('');
  });

  it('interprets "off" as false', () => {
    const { options, question } = parseOptions('/verbose=off');
    expect(options.isEnabled('verbose')).toBe(false);
    expect(question).toBe('');
  });

  it(`interprets a string option`, () => {
    const { options, question } = parseOptions('/verbose=hello');
    expect(options.stringValue('verbose')).toBe('hello');
    expect(question).toBe('');
  });

  it(`interprets nooption as 'false'`, () => {
    const { options, question } = parseOptions('/noverbose');
    expect(options.isEnabled('verbose')).toBe(false);
    expect(options.isEnabled('noverbose')).toBe(undefined);
    expect(question).toBe('');
  });

  it(`ignores an option that isn't at the beginning of the question`, () => {
    const { options, question } = parseOptions('hello /verbose');
    expect(options.isEnabled('verbose')).toBe(undefined);
    expect(question).toBe('hello /verbose');
  });

  it(`prunes the option out of the question`, () => {
    const { options, question } = parseOptions('/verbose hello');
    expect(options.isEnabled('verbose')).toBe(true);
    expect(question).toBe('hello');
  });

  it(`ignores leading spaces`, () => {
    const { options, question } = parseOptions(' /verbose hello');
    expect(options.isEnabled('verbose')).toBe(true);
    expect(question).toBe('hello');
  });

  it(`preserves trailing space`, () => {
    const { options, question } = parseOptions('/verbose hello ');
    expect(options.isEnabled('verbose')).toBe(true);
    expect(question).toBe('hello ');
  });

  it('parses multiple options', () => {
    const { options, question } = parseOptions('/verbose /quiet hello');
    expect(options.isEnabled('verbose')).toBe(true);
    expect(options.isEnabled('quiet')).toBe(true);
    expect(question).toBe('hello');
  });
});
