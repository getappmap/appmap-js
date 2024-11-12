import { AgentOptions } from '../src/agent';
import { UserOptions } from '../src/lib/parse-options';

describe('AgentOptions', () => {
  const question = 'How does the user login handle the case when the password is invalid?';

  describe('with user options', () => {
    it('builds context filters', () => {
      const options = {
        include: 'test',
      };
      const userOptions = new UserOptions(new Map(Object.entries(options)));
      const agentOptions = new AgentOptions(question, question, userOptions, [], []);
      const filters = agentOptions.buildContextFilters();
      expect(filters).toEqual({
        include: ['test'],
      });
    });

    it('builds locations and excludes from code selection locations', () => {
      const userOptions = new UserOptions(new Map());
      const agentOptions = new AgentOptions(
        question,
        question,
        userOptions,
        [],
        [],
        [{ type: 'file', location: 'file1.md' }]
      );
      const filters = agentOptions.buildContextFilters();
      expect(filters).toEqual({ locations: ['file1.md'], exclude: ['file1.md'] });
    });
  });
});
