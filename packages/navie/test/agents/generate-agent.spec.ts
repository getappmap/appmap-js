import InteractionHistory, { isPromptEvent } from '../../src/interaction-history';
import ApplyContextService from '../../src/services/apply-context-service';
import VectorTermsService from '../../src/services/vector-terms-service';
import LookupContextService from '../../src/services/lookup-context-service';
import { AgentOptions } from '../../src/agent';
import { suggestsVectorTerms } from '../fixture';
import { GenerateAgent } from '../../src/agents/generate-agent';

describe('@generate agent', () => {
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
      contextFn: jest.fn(),
    } as unknown as LookupContextService;
    vectorTermsService = suggestsVectorTerms('How does user management work?', undefined);
    LookupContextService.lookupAndApplyContext = jest.fn();
    applyContextService = {
      addSystemPrompts: jest.fn(),
      applyContext: jest.fn(),
    } as unknown as ApplyContextService;
  });

  afterEach(() => jest.restoreAllMocks());

  function buildAgent(): GenerateAgent {
    return new GenerateAgent(
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
      projectInfo: [],
    };

    it('invokes the vector terms service', async () => {
      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(vectorTermsService.suggestTerms).toHaveBeenCalledWith(
        'How does user management work?'
      );
    });

    it('invokes the lookup context service', async () => {
      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(LookupContextService.lookupAndApplyContext).toHaveBeenCalledWith(
        lookupContextService,
        applyContextService,
        ['user', 'management'],
        tokensAvailable
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
          name: 'issueDescription',
        },
      ]);
    });
  });
});
