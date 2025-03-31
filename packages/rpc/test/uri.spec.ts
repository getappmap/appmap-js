import { URI, FileLineRange } from '../src/uri';

interface BaseExpectedParsed {
  scheme: string;
  authority?: string;
  fsPath?: string; // If unspecified, fsPath should match the input exactly
  path: string;
  fragment?: string;
  query?: string;
  range?: FileLineRange;
}

interface FromFilePathTestCase {
  desc: string;
  platform: 'windows' | 'posix' | 'mixed';
  inputPath: string;
  inputRange?: FileLineRange;
  expectedUri: string;
  expectedParsed: BaseExpectedParsed;
}

interface ParseTestCase {
  desc: string;
  platform: 'windows' | 'posix' | 'general';
  inputUri: string;
  expectedParsed: BaseExpectedParsed;
}

// --- Test Cases (Keep the existing fromFilePathTestCases array) ---
const fromFilePathTestCases: FromFilePathTestCase[] = [
  {
    desc: 'Windows Absolute Path (Backslashes)',
    platform: 'windows',
    inputPath: 'C:\\foo\\bar.txt',
    expectedUri: 'file://C:\\foo\\bar.txt',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: 'C:\\foo\\bar.txt',
      fsPath: 'C:\\foo\\bar.txt',
    },
  },
  {
    desc: 'Windows Absolute Path (Lowercase Drive)',
    platform: 'windows',
    inputPath: 'c:\\foo\\bar.txt',
    expectedUri: 'file://c:\\foo\\bar.txt',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: 'c:\\foo\\bar.txt',
      fsPath: 'c:\\foo\\bar.txt',
    },
  },
  {
    desc: 'Windows UNC Path (Backslashes)',
    platform: 'windows',
    inputPath: '\\\\server\\share\\path\\file.ts',
    expectedUri: 'file://server/share/path/file.ts',
    expectedParsed: {
      scheme: 'file',
      authority: 'server',
      path: '/share/path/file.ts',
      fsPath: '/share/path/file.ts',
    },
  },
  {
    desc: 'Windows UNC Path (Admin Share C$)',
    platform: 'windows',
    inputPath: '\\\\server\\C$\\path\\file.ts',
    expectedUri: 'file://server/C$/path/file.ts',
    expectedParsed: {
      scheme: 'file',
      authority: 'server',
      path: '/C$/path/file.ts',
      fsPath: '/C$/path/file.ts',
    },
  },
  {
    desc: 'POSIX-style UNC Path',
    platform: 'mixed', // Can occur on Windows or systems interpreting // as UNC
    inputPath: '//server/share/path/file.ts',
    expectedUri: 'file://server/share/path/file.ts',
    expectedParsed: {
      scheme: 'file',
      authority: 'server',
      path: '/share/path/file.ts',
      fsPath: '/share/path/file.ts',
    },
  },
  {
    desc: 'Windows Absolute Path with Space',
    platform: 'windows',
    inputPath: 'C:\\Users\\User Name\\file.txt',
    expectedUri: 'file://C:\\Users\\User%20Name\\file.txt',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: 'C:\\Users\\User Name\\file.txt',
      fsPath: 'C:\\Users\\User Name\\file.txt',
    },
  },
  {
    desc: 'Windows Absolute Path (Forward Slashes, Non-ASCII)',
    platform: 'windows',
    inputPath: 'C:/Users/Jörg/datei.txt',
    expectedUri: 'file://C:/Users/Jörg/datei.txt',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: 'C:/Users/Jörg/datei.txt',
      fsPath: 'C:/Users/Jörg/datei.txt',
    },
  },
  {
    desc: 'Windows Absolute Path with Special URI Chars (#, ?)',
    platform: 'windows',
    inputPath: 'C:\\foo\\ba#r\\baz?.txt',
    expectedUri: 'file://C:\\foo\\ba%23r\\baz%3F.txt',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: 'C:\\foo\\ba#r\\baz?.txt',
      fsPath: 'C:\\foo\\ba#r\\baz?.txt',
    },
  },
  {
    desc: 'Windows Root Path',
    platform: 'windows',
    inputPath: 'C:\\',
    expectedUri: 'file://C:\\',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: 'C:\\',
      fsPath: 'C:\\',
    },
  },
  {
    desc: 'Relative Path (POSIX style)',
    platform: 'mixed',
    inputPath: 'foo/bar.txt',
    expectedUri: 'file:foo/bar.txt',
    expectedParsed: {
      scheme: 'file',
      authority: undefined,
      path: 'foo/bar.txt',
      fsPath: 'foo/bar.txt',
    },
  },
  {
    desc: 'POSIX Absolute Path',
    platform: 'posix',
    inputPath: '/foo/bar.txt',
    expectedUri: 'file:///foo/bar.txt',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: '/foo/bar.txt',
      fsPath: '/foo/bar.txt',
    },
  },
  {
    desc: 'Relative Path with Parent Dir',
    platform: 'mixed',
    inputPath: '../foo/bar.txt',
    expectedUri: 'file:../foo/bar.txt',
    expectedParsed: {
      scheme: 'file',
      authority: undefined,
      path: '../foo/bar.txt',
      fsPath: '../foo/bar.txt',
    },
  },
  {
    desc: 'POSIX Absolute Path with Space',
    platform: 'posix',
    inputPath: '/foo bar/baz.txt',
    expectedUri: 'file:///foo%20bar/baz.txt',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: '/foo bar/baz.txt',
      fsPath: '/foo bar/baz.txt',
    },
  },
  {
    desc: 'POSIX Absolute Path Non-ASCII',
    platform: 'posix',
    inputPath: '/users/Jörg/datei.txt',
    expectedUri: 'file:///users/Jörg/datei.txt',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: '/users/Jörg/datei.txt',
      fsPath: '/users/Jörg/datei.txt',
    },
  },
  {
    desc: 'POSIX Absolute Path Special URI Chars (#, ?)',
    platform: 'posix',
    inputPath: '/foo/ba#r/baz?.txt',
    expectedUri: 'file:///foo/ba%23r/baz%3F.txt',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: '/foo/ba#r/baz?.txt',
      fsPath: '/foo/ba#r/baz?.txt',
    },
  },
  {
    desc: 'POSIX Root Path',
    platform: 'posix',
    inputPath: '/',
    expectedUri: 'file:///',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: '/',
      fsPath: '/',
    },
  },
  {
    desc: 'Empty Path',
    platform: 'mixed',
    inputPath: '',
    expectedUri: 'file:',
    expectedParsed: {
      scheme: 'file',
      authority: undefined,
      path: '',
      fsPath: '',
    },
  },
  {
    desc: 'Relative Path (Windows style)',
    platform: 'windows', // More common on Windows, but treated as relative path chars
    inputPath: 'foo\\bar.txt',
    expectedUri: 'file:foo\\bar.txt',
    expectedParsed: {
      scheme: 'file',
      authority: undefined,
      path: 'foo\\bar.txt',
      fsPath: 'foo\\bar.txt',
    },
  },
  {
    desc: 'Windows Absolute Path with Range',
    platform: 'windows',
    inputPath: 'C:\\foo\\bar.txt',
    inputRange: { start: 5, end: 10 },
    expectedUri: 'file://C:\\foo\\bar.txt#L5-L10',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: 'C:\\foo\\bar.txt',
      fsPath: 'C:\\foo\\bar.txt',
      fragment: 'L5-L10',
      range: { start: 5, end: 10 },
    },
  },
  {
    desc: 'POSIX Absolute Path with Range (Single Line)',
    platform: 'posix',
    inputPath: '/foo/bar.txt',
    inputRange: { start: 1 },
    expectedUri: 'file:///foo/bar.txt#L1',
    expectedParsed: {
      scheme: 'file',
      authority: '',
      path: '/foo/bar.txt',
      fsPath: '/foo/bar.txt',
      fragment: 'L1',
      range: { start: 1 },
    },
  },
  {
    desc: 'Relative Path with Range',
    platform: 'mixed',
    inputPath: 'foo/bar.txt',
    inputRange: { start: 100, end: 100 },
    expectedUri: 'file:foo/bar.txt#L100-L100',
    expectedParsed: {
      scheme: 'file',
      authority: undefined,
      path: 'foo/bar.txt',
      fsPath: 'foo/bar.txt',
      fragment: 'L100-L100',
      range: { start: 100, end: 100 },
    },
  },
];

describe('URI', () => {
  describe('file', () => {
    const runTest = (testCase: FromFilePathTestCase) => {
      // 1. Test URI.file() generation
      const actualUriInstance = URI.file(testCase.inputPath, testCase.inputRange);
      const actualUriString = actualUriInstance.toString();

      // Assert the generated string matches the expectation
      expect(actualUriString).toEqual(testCase.expectedUri);

      // 2. Test round-tripping: parse the generated URI back
      const parsedUri = URI.parse(actualUriString);

      // 3. Compare public getters of the parsed URI against expected values
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { fsPath: _fsPath, range: _range, ...expectedBaseComponents } = testCase.expectedParsed;
      const expectedFsPath = testCase.expectedParsed.fsPath ?? testCase.expectedParsed.path;
      const expectedRange = testCase.expectedParsed.range;

      expect({
        scheme: parsedUri.scheme,
        authority: parsedUri.authority,
        path: parsedUri.path,
        query: parsedUri.query,
        fragment: parsedUri.fragment,
      }).toEqual(expectedBaseComponents);
      expect(parsedUri.fsPath).toEqual(expectedFsPath);
      expect(parsedUri.range).toEqual(expectedRange);
    };

    describe('windows', () => {
      fromFilePathTestCases
        .filter((tc) => tc.platform === 'windows' || tc.platform === 'mixed') // Include mixed for coverage
        .forEach((tc, index) => {
          it(`(${index}) ${tc.desc}`, () => runTest(tc));
        });
    });

    describe('posix', () => {
      fromFilePathTestCases
        .filter((tc) => tc.platform === 'posix' || tc.platform === 'mixed') // Include mixed for coverage
        .forEach((tc, index) => {
          it(`(${index}) ${tc.desc}`, () => runTest(tc));
        });
    });
  });

  describe('parse', () => {
    // Add specific URI.parse test cases here if needed, beyond the round-trip checks
    // in the URI.file tests.
    const parseTestCases: ParseTestCase[] = [
      {
        desc: 'HTTP Basic',
        platform: 'general',
        inputUri: 'http://example.com/path?q=1#frag',
        expectedParsed: {
          scheme: 'http',
          authority: 'example.com',
          path: '/path',
          query: 'q=1',
          fragment: 'frag',
          fsPath: '/path',
        },
      },
      {
        desc: 'HTTPS with port and userinfo',
        platform: 'general',
        inputUri: 'https://user:pass@example.com:8080/p?q=x#f',
        expectedParsed: {
          scheme: 'https',
          authority: 'user:pass@example.com:8080',
          path: '/p',
          query: 'q=x',
          fragment: 'f',
          fsPath: '/p',
        },
      },
      {
        desc: 'URN UUID',
        platform: 'general',
        inputUri: 'urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
        expectedParsed: {
          scheme: 'urn',
          authority: undefined,
          path: 'uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
          fsPath: 'uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
        },
      },
      {
        desc: 'File POSIX Absolute (triple slash)',
        platform: 'posix',
        inputUri: 'file:///etc/passwd',
        expectedParsed: {
          scheme: 'file',
          authority: '',
          path: '/etc/passwd',
          fsPath: '/etc/passwd',
        },
      },
      {
        desc: 'File Windows Absolute (double slash, backslashes)',
        platform: 'windows',
        inputUri: 'file://C:\\Windows\\System32\\cmd.exe',
        expectedParsed: {
          scheme: 'file',
          authority: '',
          path: 'C:\\Windows\\System32\\cmd.exe',
          fsPath: 'C:\\Windows\\System32\\cmd.exe',
        },
      },
      {
        desc: 'File Windows Absolute (double slash, forward slashes)',
        platform: 'windows',
        inputUri: 'file://C:/Windows/System32/cmd.exe',
        expectedParsed: {
          scheme: 'file',
          authority: '',
          path: 'C:/Windows/System32/cmd.exe',
          fsPath: 'C:/Windows/System32/cmd.exe',
        },
      },
      {
        desc: 'File UNC (double slash)',
        platform: 'windows',
        inputUri: 'file://server/share/file.txt',
        expectedParsed: {
          scheme: 'file',
          authority: 'server',
          path: '/share/file.txt',
          fsPath: '/share/file.txt',
        },
      },
      {
        desc: 'File Relative (single colon)',
        platform: 'general',
        inputUri: 'file:relative/path/file.txt',
        expectedParsed: {
          scheme: 'file',
          authority: undefined,
          path: 'relative/path/file.txt',
          fsPath: 'relative/path/file.txt',
        },
      },
      {
        desc: 'File POSIX Absolute with special chars in path',
        platform: 'posix',
        inputUri: 'file:///var/tmp/foo%23bar/baz%3F.txt', // Assume correctly %-encoded input
        expectedParsed: {
          scheme: 'file',
          authority: '',
          path: '/var/tmp/foo#bar/baz?.txt',
          fsPath: '/var/tmp/foo#bar/baz?.txt',
        },
      },
    ];

    parseTestCases.forEach((tc, index) => {
      it(`(${index}) ${tc.desc}`, () => {
        const parsedUri = URI.parse(tc.inputUri);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { fsPath: _fsPath, range: _range, ...expectedBaseComponents } = tc.expectedParsed;
        const expectedFsPath = tc.expectedParsed.fsPath ?? tc.expectedParsed.path;
        const expectedRange = tc.expectedParsed.range;

        expect({
          scheme: parsedUri.scheme,
          authority: parsedUri.authority,
          path: parsedUri.path,
          query: parsedUri.query,
          fragment: parsedUri.fragment,
        }).toEqual(expectedBaseComponents);
        expect(parsedUri.fsPath).toStrictEqual(expectedFsPath);
        expect(parsedUri.range).toStrictEqual(expectedRange);
      });
    });
  });

  describe('random', () => {
    it('generates a valid UUID URN', () => {
      const randomUri = URI.random().toString();
      expect(randomUri).toMatch(
        /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it('generates different URIs on subsequent calls', () => {
      const uri1 = URI.random().toString();
      const uri2 = URI.random().toString();
      expect(uri1).toMatch(/^urn:uuid:/);
      expect(uri2).toMatch(/^urn:uuid:/);
      expect(uri1).not.toEqual(uri2);
    });
  });

  describe('toString/parse round trip equality', () => {
    const uris = [
      'http://example.com',
      'http://example.com/',
      'http://example.com/path',
      'http://example.com/path?query',
      'http://example.com/path?query#fragment',
      'http://example.com#fragment',
      'https://user:pass@example.com:1234/p?q=1&u=2#f=3',
      'mailto:test@example.com',
      'urn:isbn:0451450523',
      'file:///path/to/file',
      'file://C:\\path\\to\\file',
      'file://server/share/file',
      'file:relative/path',
      'file:///path/with%20space',
      'file:///path/with%23hash/in#fragment',
    ];

    uris.forEach((uriString) => {
      it(`should round trip: ${uriString}`, () => {
        const parsed = URI.parse(uriString);
        expect(parsed.toString()).toStrictEqual(uriString);
      });
    });
  });
});
