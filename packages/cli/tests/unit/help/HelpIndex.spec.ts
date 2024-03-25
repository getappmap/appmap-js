import { join } from 'path';
import { HelpIndex, buildHelpIndex } from '../../../src/cmds/navie/help';

describe('HelpIndex', () => {
  let helpIndex: HelpIndex;

  beforeAll(async () => {
    helpIndex = await buildHelpIndex(join(__dirname, '..', '..', '..', '..', '..', 'docs'));
  });

  it('searches for help snippets', async () => {
    expect(helpIndex).toBeDefined();

    const matches = await helpIndex.search(['java', 'maven'], 3);
    for (const match of matches) {
      expect(match.content.toLowerCase()).toContain('maven');
      expect(match.content.toLowerCase()).toContain('java');
    }
  });
});
