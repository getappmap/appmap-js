import collectHelp from '../../../../src/cmds/navie/help';

describe('collectHelp', () => {
  it('returns an empty response if no vector terms are provided', async () => {
    const emptyVectorTerms = [[], [''], [' ']];
    for (const vectorTerms of emptyVectorTerms) {
      const res = await collectHelp({ type: 'help', vectorTerms, tokenCount: 1000 });
      expect(res).toEqual([]);
    }
  });

  it('searches the help index if vector terms are provided', async () => {
    const res = await collectHelp({ type: 'help', vectorTerms: ['appmap'], tokenCount: 1000 });
    expect(res.length).toBeGreaterThan(0);
  });
});
