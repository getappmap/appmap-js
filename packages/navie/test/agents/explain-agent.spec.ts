import ExplainAgent from '../../src/agents/explain-agent';
import InteractionHistory, { isPromptEvent } from '../../src/interaction-history';
import ApplyContextService from '../../src/services/apply-context-service';
import VectorTermsService from '../../src/services/vector-terms-service';
import LookupContextService from '../../src/services/lookup-context-service';
import { AgentOptions } from '../../src/agent';
import { SEARCH_CONTEXT, suggestsVectorTerms } from '../fixture';
import { HelpResponse } from '../../src/help';
import { CHARACTERS_PER_TOKEN } from '../../src/message';
import { UserOptions } from '../../src/lib/parse-options';
import ContextService from '../../src/services/context-service';

describe('@explain agent', () => {
  let interactionHistory: InteractionHistory;
  let vectorTermsService: VectorTermsService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let contextService: ContextService;
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
    contextService = new ContextService(
      vectorTermsService,
      lookupContextService,
      applyContextService
    );
  });

  afterEach(() => jest.restoreAllMocks());

  function buildAgent(): ExplainAgent {
    return new ExplainAgent(interactionHistory, contextService);
  }

  describe('#perform', () => {
    const initialQuestionOptions = new AgentOptions(
      'How does user management work?',
      'How does user management work?',
      new UserOptions(new Map()),
      [],
      [
        {
          directory: 'twitter',
          appmapConfig: { language: 'ruby' } as unknown as any,
          appmapStats: { numAppMaps: 1 } as unknown as any,
        },
      ]
    );

    it('invokes the vector terms service', async () => {
      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(vectorTermsService.suggestTerms).toHaveBeenCalledWith(
        'How does user management work?'
      );
    });

    it('looks up code context (only)', async () => {
      const context = SEARCH_CONTEXT;
      lookupContextService.lookupContext = jest.fn().mockResolvedValue(context);
      lookupContextService.lookupHelp = jest.fn();

      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(lookupContextService.lookupContext).toHaveBeenCalledWith(
        ['user', 'management'],
        tokensAvailable,
        {}
      );
      expect(lookupContextService.lookupHelp).not.toHaveBeenCalled();

      expect(applyContextService.applyContext).toHaveBeenCalledWith(
        context,
        [],
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

    it('propagates context filters from user options', async () => {
      const options = new AgentOptions(
        'How does user management work?',
        'How does user management work?',
        new UserOptions(new Map(Object.entries({ include: 'test', exclude: '\\.md' }))),
        [],
        []
      );

      const context = SEARCH_CONTEXT;
      lookupContextService.lookupContext = jest.fn().mockResolvedValue(context);
      lookupContextService.lookupHelp = jest.fn();

      await buildAgent().perform(options, () => tokensAvailable);

      expect(lookupContextService.lookupContext).toHaveBeenCalledWith(
        ['user', 'management'],
        tokensAvailable,
        {
          include: ['test'],
          exclude: ['\\.md'],
        }
      );
    });
  });
});
