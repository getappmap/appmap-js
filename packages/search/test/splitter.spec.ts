import { langchainSplitter } from '../src/splitter';

describe('langchainSplitter', () => {
  it('should extract complete lines while maintaining indentation for long content', async () => {
    const content = Array(200).fill('  console.log("Indented");').join('\n');
    const fileExtension = 'js';

    const chunks = await langchainSplitter(content, fileExtension);
    for (const chunk of chunks) expect(chunk.content).toMatch(/^ {2}/);
  });
});
