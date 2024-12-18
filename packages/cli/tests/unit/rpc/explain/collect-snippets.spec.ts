import { SnippetIndex } from '@appland/search';
import { SnippetType } from '@appland/search/built/snippet-index';

import collectSnippets from '../../../../src/rpc/explain/collect-snippets';

describe('collectSnippets', () => {
  it('should build location with start and end line numbers', () => {
    const snippetIndex: SnippetIndex = {
      searchSnippets: jest.fn().mockReturnValue([
        {
          snippetId: {
            id: 'file1.js:1',
            type: SnippetType.FileChunk,
          },
          content: 'line1\nline2\nline3',
          directory: '/path/to/dir',
        },
      ]),
    } as never;

    const sessionId = 'session-id';
    const query = 'query';
    const charLimit = 100;

    const result = collectSnippets(snippetIndex, sessionId, query, charLimit);

    expect(result).toEqual([
      {
        directory: '/path/to/dir',
        type: 'code-snippet',
        content: 'line1\nline2\nline3',
        location: 'file1.js:1-3',
      },
    ]);
  });
});
