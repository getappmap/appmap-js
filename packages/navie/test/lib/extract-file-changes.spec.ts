import extractFileChanges from '../../src/lib/extract-file-changes';

describe('extractFileChanges', () => {
  it('returns empty array when no change tags are present', () => {
    const content = 'Some random content without change tags.';
    expect(extractFileChanges(content)).toEqual([]);
  });

  it('extracts a simple change tag with original and modified sections', () => {
    const content = `
<change>
  <original>old code</original>
  <modified>new code</modified>
</change>
`;
    const result = extractFileChanges(content);
    expect(result).toHaveLength(1);
    expect(result[0].original).toBe('old code');
    expect(result[0].modified).toBe('new code');
  });

  it('handles CDATA sections correctly', () => {
    const content = `
<change>
  <original><![CDATA[
class User
end
]]></original>
  <modified><![CDATA[
class User
  has_many :posts
end
]]></modified>
</change>
`;
    const result = extractFileChanges(content);
    expect(result).toHaveLength(1);
    expect(result[0].original).toBe('class User\nend');
    expect(result[0].modified).toBe('class User\n  has_many :posts\nend');
  });

  it('extracts multiple change tags', () => {
    const content = `
Some explanation.
<change>
  <original>first old</original>
  <modified>first new</modified>
</change>
And some intermediate text.
<change>
  <original>second old</original>
  <modified>second new</modified>
</change>
`;
    const result = extractFileChanges(content);
    expect(result).toHaveLength(2);
    expect(result[0].original).toBe('first old');
    expect(result[0].modified).toBe('first new');
    expect(result[1].original).toBe('second old');
    expect(result[1].modified).toBe('second new');
  });

  it('trims leading and trailing blank lines', () => {
    const content = `
<change>
  <original>

leading blank lines

</original>
  <modified>

trailing blank lines

</modified>
</change>
`;
    const result = extractFileChanges(content);
    expect(result).toHaveLength(1);
    expect(result[0].original).toBe('leading blank lines');
    expect(result[0].modified).toBe('trailing blank lines');
  });

  it('preserves leading indentation on the first line', () => {
    const content = `
<change>
  <original>  def my_method</original>
  <modified>  def my_method_updated</modified>
</change>
`;
    const result = extractFileChanges(content);
    expect(result).toHaveLength(1);
    expect(result[0].original).toBe('  def my_method');
    expect(result[0].modified).toBe('  def my_method_updated');
  });

  it('extracts <file> and trims surrounding whitespace', () => {
    const content = `
<change>
  <file>
    /tmp/example.rb
  </file>
  <original>old</original>
  <modified>new</modified>
</change>
`;
    const result = extractFileChanges(content);
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe('/tmp/example.rb');
  });
});
