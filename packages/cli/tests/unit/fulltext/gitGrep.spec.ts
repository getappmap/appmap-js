import { assert } from 'console';
import { Chunk } from '../../../src/fulltext/SourceIndex';
import gitGrep from '../../../src/fulltext/gitGrep';
import { executeCommand } from '../../../src/lib/executeCommand';

// Mock `executeCommand` instead of the global `exec`
jest.mock('../../../src/lib/executeCommand', () => ({
  executeCommand: jest.fn(),
}));

describe('gitGrep', () => {
  const directory = '/test/directory';
  const keyword = 'testKeyword';
  let executeCommandFn: jest.Mock;

  beforeEach(() => {
    executeCommandFn = jest.mocked(executeCommand);
  });

  const assertChunks = async (mockOutput: string, expectedChunks: Chunk[]) => {
    executeCommandFn.mockResolvedValueOnce(mockOutput);
    const chunks = await gitGrep(directory, keyword);
    expect(chunks).toEqual(expectedChunks);
  };

  it('returns a multi-line chunk', async () => {
    assertChunks(
      `
file1.js-23-this is a test line
file1.js-24-another test line
`,
      [
        {
          directory,
          fileName: 'file1.js',
          from: 23,
          to: 24,
          content: 'this is a test line\nanother test line',
        },
      ]
    );
  });

  it('parses the chunk separator', async () => {
    assertChunks(
      `file1.js-23-this is a test line - it has an embedded -- in it
--
file2.js-45-another test line
`,
      [
        {
          directory,
          fileName: 'file1.js',
          from: 23,
          to: 23,
          content: 'this is a test line - it has an embedded -- in it',
        },
        {
          directory,
          fileName: 'file2.js',
          from: 45,
          to: 45,
          content: 'another test line',
        },
      ]
    );
  });

  it('should ignore all import/require lines', async () => {
    assertChunks(
      `
importTest.js-1-import something from 'somewhere'
importTest.js-2-const { test } = require('testModule')
`,
      []
    );
  });

  it('should handle no matches gracefully', async () => {
    assertChunks('', []);
  });

  it('should correctly process file names and line numbers with special characters', async () => {
    assertChunks(
      `
special-char-file-1@$%.js-123-a line with special characters
`,
      [
        {
          directory,
          fileName: 'special-char-file-1@$%.js',
          from: 123,
          to: 123,
          content: 'a line with special characters',
        },
      ]
    );
  });

  it('handles multiple instances of the separator within the content', async () => {
    assertChunks(
      `
src/components/ComponentName.vue-78-function value() => "some -- string -- with separators";
`,
      [
        {
          directory,
          fileName: 'src/components/ComponentName.vue',
          from: 78,
          to: 78,
          content: 'function value() => "some -- string -- with separators";',
        },
      ]
    );
  });

  it('handles files without extensions', async () => {
    assertChunks(
      `
bin/deploy-12-# Deploy script version 1.2 --revision=20220401
--
README-22-This is a --fake flag in documentation
`,
      [
        {
          directory,
          fileName: 'bin/deploy',
          from: 12,
          to: 12,
          content: '# Deploy script version 1.2 --revision=20220401',
        },
        {
          directory,
          fileName: 'README',
          from: 22,
          to: 22,
          content: 'This is a --fake flag in documentation',
        },
      ]
    );
  });
});
