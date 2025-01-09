import path from 'node:path';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { fs, vol } from 'memfs';

import lookupSourceCode from '../../../../src/rpc/explain/lookupSourceCode';

describe('lookupSourceCode', () => {
  const directory = '/project';
  const fileName = 'example.rb';
  const sourceCodeSnippet = 'module A\n  class B\n    def foo\n      pass\n    end\n  end\nend';
  const filePath = path.join(directory, fileName);

  it('returns the correct snippet object', async () => {
    const snippet = await lookupSourceCode(directory, `${fileName}:3`);
    expect(snippet).toEqual({
      content: sourceCodeSnippet,
      location: 'example.rb:1-7',
    });
  });

  it('preserves indents even on a chunk boundary', async () => {
    const smallSplitter = RecursiveCharacterTextSplitter.fromLanguage('ruby', {
      chunkSize: 10,
      chunkOverlap: 0,
    });
    jest.spyOn(RecursiveCharacterTextSplitter, 'fromLanguage').mockReturnValue(smallSplitter);
    const snippet = await lookupSourceCode(directory, `${fileName}:4`);
    expect(snippet).toEqual({
      content: '      pass',
      location: 'example.rb:4-4',
    });
  });

  it('returns undefined for non-existent line', async () => {
    const snippet = await lookupSourceCode(directory, `${fileName}:10`);
    expect(snippet).toBeUndefined();
  });

  beforeEach(() => {
    vol.mkdirSync(directory, { recursive: true });
    vol.writeFileSync(filePath, sourceCodeSnippet);
  });

  afterEach(() => {
    vol.reset();
    jest.restoreAllMocks();
  });
});

jest.mock('fs', () => fs);
jest.mock('fs/promises', () => fs.promises);
