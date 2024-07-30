import Location from '../../../../src/rpc/explain/location';

describe('Location', () => {
  it('parses a location without line numbers', () => {
    const location = Location.parse('path/to/file.rb');
    expect(location).toEqual(new Location('path/to/file.rb'));
  });

  it('parses a location with a single line number', () => {
    const location = Location.parse('path/to/file.rb:1');
    expect(location).toEqual(new Location('path/to/file.rb', '1'));
  });

  it('parses a location with a line range', () => {
    const location = Location.parse('path/to/file.rb:1-2');
    expect(location).toEqual(new Location('path/to/file.rb', '1-2'));
  });

  it('parses a location with a drive letter', () => {
    const location = Location.parse('c:/path/to/file.rb:1');
    expect(location).toEqual(new Location('c:/path/to/file.rb', '1'));
  });

  it('returns undefined for an invalid location', () => {
    const location = Location.parse('c:/invalid:location:foo:1-2');
    expect(location).toBeUndefined();
  });

  it('returns the correct snippet for a given content', () => {
    const location = new Location('path/to/file.rb', '2-3');
    const content = 'line1\nline2\nline3\nline4';
    expect(location.snippet(content)).toEqual('line2\nline3');
  });

  it('returns the full content if no line range is specified', () => {
    const location = new Location('path/to/file.rb');
    const content = 'line1\nline2\nline3\nline4';
    expect(location.snippet(content)).toEqual(content);
  });

  it('converts to string correctly', () => {
    const location = new Location('path/to/file.rb', '1-2');
    expect(location.toString()).toEqual('path/to/file.rb:1-2');
  });

  it('converts to string correctly without line range', () => {
    const location = new Location('path/to/file.rb');
    expect(location.toString()).toEqual('path/to/file.rb');
  });
});
