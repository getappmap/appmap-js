import closingTags from '../../src/lib/closing-tags';

describe('closingTags', () => {
  it('returns empty string for no unclosed tags', () => {
    expect(closingTags('<tag></tag>')).toBe('');
  });

  it('returns closing tag for single unclosed tag', () => {
    expect(closingTags('<tag>')).toBe('</tag>');
  });

  it('handles multiple unclosed tags', () => {
    expect(closingTags('<outer><inner>')).toBe('</inner></outer>');
  });

  it('handles self-closing tags', () => {
    expect(closingTags('<outer><self/><inner>')).toBe('</inner></outer>');
  });

  it('handles properly closed inner tags', () => {
    expect(closingTags('<outer><inner></inner>')).toBe('</outer>');
  });

  it('handles mixed closed and unclosed tags', () => {
    expect(closingTags('<a><b></b><c>')).toBe('</c></a>');
  });

  it('handles tags with attributes', () => {
    expect(closingTags('<div class="test"><span id="inner">')).toBe('</span></div>');
  });

  it('returns empty string for text without tags', () => {
    expect(closingTags('plain text')).toBe('');
  });
});
