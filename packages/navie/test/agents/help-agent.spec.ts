import { AgentOptions } from '../../src/agent';
import { HelpAgent } from '../../src/agents/help-agent';
import { HelpProvider, HelpRequest, HelpResponse } from '../../src/help';
import InteractionHistory from '../../src/interaction-history';
import { AppMapConfig, AppMapStats } from '../../src/project-info';
import VectorTermsService from '../../src/services/vector-terms-service';
import { suggestsVectorTerms } from '../fixture';

describe('HelpAgent', () => {
  const question = 'How to make a diagram?';
  let history: InteractionHistory;
  let helpProvider: HelpProvider;
  let vectorTermsService: VectorTermsService;

  function receivesHelpDocs(): void {
    helpProvider = jest.fn().mockImplementation((request: HelpRequest): Promise<HelpResponse> => {
      expect(request.type).toEqual('help');
      expect(request.vectorTerms).toEqual(['ruby', 'diagram']);
      expect(request.tokenCount).toEqual(1000);
      return Promise.resolve([
        {
          filePath: 'ruby-diagram.md',
          from: 1,
          to: 2,
          content: 'steps to make a Ruby appmap diagram',
          score: 1,
        },
      ]);
    });
  }

  beforeEach(() => {
    history = new InteractionHistory();
    vectorTermsService = suggestsVectorTerms(question, undefined, ['diagram']);
  });

  function buildAgent(): HelpAgent {
    return new HelpAgent(history, helpProvider, vectorTermsService);
  }

  describe('when there are no AppMaps', () => {
    const options = new AgentOptions(
      question,
      question,
      [],
      [
        {
          appmapConfig: { language: 'ruby' } as unknown as AppMapConfig,
          appmapStats: { numAppMaps: 0 } as unknown as AppMapStats,
        },
      ]
    );

    beforeEach(receivesHelpDocs);

    it('searches for help docs', async () => {
      await buildAgent().perform(options, () => 1000);

      expect(helpProvider).toHaveBeenCalled();
    });
    it('prompts the user to create AppMaps', async () => {
      await buildAgent().perform(options, () => 1000);

      expect(history.events.map((event) => event.metadata)).toEqual([
        {
          name: 'agent',
          role: 'system',
          type: 'prompt',
        },
        {
          name: 'question',
          role: 'system',
          type: 'prompt',
        },
        {
          name: 'makeAppMaps',
          role: 'system',
          type: 'prompt',
        },
        {
          name: 'prefixTip',
          role: 'system',
          type: 'prompt',
        },
        {
          name: 'noAppMaps',
          role: 'user',
          type: 'prompt',
        },
        {
          name: 'helpDoc',
          role: 'system',
          type: 'prompt',
        },
        {
          name: 'helpDoc',
          role: 'system',
          type: 'prompt',
        },
      ]);
    });
  });
  describe('when there are AppMaps', () => {
    const options = new AgentOptions(
      question,
      question,
      [],
      [
        {
          appmapConfig: { language: 'ruby' } as unknown as AppMapConfig,
          appmapStats: { numAppMaps: 10 } as unknown as AppMapStats,
        },
      ]
    );

    describe('and it receives help docs', () => {
      beforeEach(receivesHelpDocs);

      it('searches for help docs', async () => {
        await buildAgent().perform(options, () => 1000);

        expect(helpProvider).toHaveBeenCalled();
      });

      it('prompts based on the help docs', async () => {
        await buildAgent().perform(options, () => 1000);

        expect(history.events.map((event) => event.metadata)).toEqual([
          {
            name: 'agent',
            role: 'system',
            type: 'prompt',
          },
          {
            name: 'question',
            role: 'system',
            type: 'prompt',
          },
          {
            name: 'helpDoc',
            role: 'system',
            type: 'prompt',
          },
          {
            name: 'helpDoc',
            role: 'system',
            type: 'prompt',
          },
        ]);
      });
    });

    describe('and it does not find matching help', () => {
      beforeEach(() => {
        helpProvider = jest.fn().mockImplementation(() => Promise.resolve([]));
      });

      it('prompts that no help docs were found', async () => {
        await buildAgent().perform(options, () => 1000);

        expect(history.events.map((event) => event.metadata)).toEqual([
          {
            name: 'agent',
            role: 'system',
            type: 'prompt',
          },
          {
            name: 'question',
            role: 'system',
            type: 'prompt',
          },
          {
            name: 'noHelpDoc',
            role: 'system',
            type: 'prompt',
          },
        ]);
      });
    });
  });
});
