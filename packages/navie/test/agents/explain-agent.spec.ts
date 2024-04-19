import ExplainAgent from '../../src/agents/explain-agent';
import InteractionHistory, { isPromptEvent } from '../../src/interaction-history';
import ApplyContextService from '../../src/services/apply-context-service';
import VectorTermsService from '../../src/services/vector-terms-service';
import LookupContextService from '../../src/services/lookup-context-service';
import { AgentOptions } from '../../src/agent';
import { SEARCH_CONTEXT, suggestsVectorTerms } from '../fixture';
import { HelpResponse } from '../../src/help';
import { CHARACTERS_PER_TOKEN } from '../../src/message';

describe('@explain agent', () => {
  let interactionHistory: InteractionHistory;
  let vectorTermsService: VectorTermsService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let tokensAvailable: number;

  beforeEach(async () => {
    tokensAvailable = 1000;
    interactionHistory = new InteractionHistory();
    lookupContextService = {
      lookupContext: jest.fn(),
      lookupHelp: jest.fn(),
      contextFn: jest.fn(),
    } as unknown as LookupContextService;
    vectorTermsService = suggestsVectorTerms('How does user management work?', undefined);
    applyContextService = {
      addSystemPrompts: jest.fn(),
      applyContext: jest.fn(),
    } as unknown as ApplyContextService;
  });

  afterEach(() => jest.restoreAllMocks());

  function buildAgent(): ExplainAgent {
    return new ExplainAgent(
      interactionHistory,
      vectorTermsService,
      lookupContextService,
      applyContextService
    );
  }

  describe('#perform', () => {
    const initialQuestionOptions: AgentOptions = {
      question: 'How does user management work?',
      aggregateQuestion: 'How does user management work?',
      chatHistory: [],
      hasAppMaps: true,
      projectInfo: [
        {
          appmapConfig: { language: 'ruby' } as unknown as any,
          appmapStats: { numAppMaps: 1 } as unknown as any,
        },
      ],
    };

    it('invokes the vector terms service', async () => {
      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(vectorTermsService.suggestTerms).toHaveBeenCalledWith(
        'How does user management work?'
      );
    });

    it('looks up context and help', async () => {
      const context = SEARCH_CONTEXT;
      const help: HelpResponse = [
        {
          filePath: 'ruby-diagram.md',
          from: 1,
          to: 2,
          content: 'steps to make a Ruby appmap diagram',
          score: 1,
        },
      ];
      lookupContextService.lookupContext = jest.fn().mockResolvedValue(context);
      lookupContextService.lookupHelp = jest.fn().mockResolvedValue(help);

      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(lookupContextService.lookupContext).toHaveBeenCalledWith(
        ['user', 'management'],
        tokensAvailable,
        undefined
      );
      expect(lookupContextService.lookupHelp).toHaveBeenCalledWith(
        ['ruby'],
        ['user', 'management'],
        tokensAvailable
      );

      expect(applyContextService.applyContext).toHaveBeenCalledWith(
        context,
        help,
        tokensAvailable * CHARACTERS_PER_TOKEN
      );
    });

    it('applies the agent and question system prompts', async () => {
      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(interactionHistory.events.map((event) => event.metadata)).toEqual([
        {
          type: 'prompt',
          role: 'system',
          name: 'agent',
        },
        {
          type: 'prompt',
          role: 'system',
          name: 'question',
        },
      ]);
    });
  });
});
