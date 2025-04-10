import type LocationType from '../../../../src/rpc/explain/location';

let currentPlatform = 'linux';
jest.mock('node:os', () => ({ platform: () => currentPlatform }));

describe('Location', () => {
  let Location: typeof LocationType;

  beforeEach(async () => {
    jest.resetModules();

    // Dynamically import the module *after* resetting modules and setting state.
    // Now, when Location.ts imports 'node:os', it will get the mock configured
    // by the jest.mock call above, reading the *current* value of currentPlatform.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    Location = (await require('../../../../src/rpc/explain/location')).default;
  });

  describe('posix', () => {
    beforeEach(() => {
      currentPlatform = 'linux';
    });

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

    it('parses a Unix style full path', () => {
      const location = Location.parse('/path/to/file.rb');
      expect(location).toEqual(new Location('/path/to/file.rb'));
    });

    it('parses a Unix style path with a line range', () => {
      const location = Location.parse('/path/to/file.rb:1-2');
      expect(location).toEqual(new Location('/path/to/file.rb', '1-2'));
    });

    it('ignores invalid characters in line range', () => {
      const location = Location.parse('path/to/file.rb:1-2a');
      expect(location).toEqual(new Location('path/to/file.rb:1-2a'));
    });

    it('parses a location with a single line number and invalid characters', () => {
      const location = Location.parse('path/to/file.rb:1a');
      expect(location).toEqual(new Location('path/to/file.rb:1a'));
    });

    it('passes through an invalid location', () => {
      const location = Location.parse('c:/invalid:location:foo:1-2');
      expect(location).toEqual(new Location('c:/invalid:location:foo', '1-2'));
    });
  });

  describe('windows', () => {
    beforeEach(() => {
      currentPlatform = 'win32';
    });

    it('parses a location with a drive letter', () => {
      const location = Location.parse('C:\\path\\to\\file.rb:1');
      expect(location).toEqual(new Location('C:\\path\\to\\file.rb', '1'));
    });

    it('passes through an invalid location', () => {
      const location = Location.parse('C:\\invalid:location:foo:1-2');
      expect(location).toEqual(new Location('C:\\invalid:location:foo', '1-2'));
    });

    it('parses a Windows path with a line range', () => {
      const location = Location.parse('C:\\path\\to\\file.rb:1-2');
      expect(location).toEqual(new Location('C:\\path\\to\\file.rb', '1-2'));
    });

    it('parses a Windows path with a single line number', () => {
      const location = Location.parse('C:\\path\\to\\file.rb:1');
      expect(location).toEqual(new Location('C:\\path\\to\\file.rb', '1'));
    });

    it('normalizes Windows path containing leading back slashes', () => {
      const location = Location.parse('\\C:\\path\\to\\file.rb:1');
      expect(location).toEqual(new Location('C:\\path\\to\\file.rb', '1'));
    });

    it('normalizes Windows path containing leading forward slashes', () => {
      const location = Location.parse('/C:\\path\\to\\file.rb:1');
      expect(location).toEqual(new Location('C:\\path\\to\\file.rb', '1'));
    });

    it('normalizes Windows drive letter casing', () => {
      const location = Location.parse('c:\\path\\to\\file.rb:1');
      expect(location).toEqual(new Location('C:\\path\\to\\file.rb', '1'));
    });

    it('normalizes Windows path separators', () => {
      const location = Location.parse('C:/path/to/file.rb:1');
      expect(location).toEqual(new Location('C:\\path\\to\\file.rb', '1'));
    });
  });

  it('handles zero starting line correctly', () => {
    const location = Location.parse('file1.js:0-2');
    const snippet = location.snippet('line 1\nline 2\nline 3');
    expect(snippet).toBe('line 1\nline 2');
  });
});
