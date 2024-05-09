import ExplainAgent from '../../src/agents/explain-agent';
import HelpAgent from '../../src/agents/help-agent';
import { ExplainOptions } from '../../src/explain';
import { HelpProvider } from '../../src/help';
import InteractionHistory from '../../src/interaction-history';
import { AppMapConfig, AppMapStats } from '../../src/project-info';
import AgentSelectionService from '../../src/services/agent-selection-service';
import ApplyContextService from '../../src/services/apply-context-service';
import LookupContextService from '../../src/services/lookup-context-service';
import VectorTermsService from '../../src/services/vector-terms-service';

describe('AgentSelectionService', () => {
  let interactionHistory: InteractionHistory;
  let helpProvider: HelpProvider;
  let vectorTermsService: VectorTermsService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let genericQuestion = 'How does user management work?';
  let helpAgentQueston = '@help How to make a diagram?';

  function buildAgentSelectionService() {
    return new AgentSelectionService(
      interactionHistory,
      helpProvider,
      vectorTermsService,
      lookupContextService,
      applyContextService
    );
  }

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    helpProvider = jest.fn();
    vectorTermsService = {} as VectorTermsService;
    lookupContextService = {} as LookupContextService;
    applyContextService = {} as ApplyContextService;
  });

  describe('when the question specifies an agent', () => {
    it('creates the specified agent', () => {
      const { agent } = buildAgentSelectionService().selectAgent(
        helpAgentQueston,
        new ExplainOptions(),
        []
      );
      expect(agent).toBeInstanceOf(HelpAgent);
    });
    it('removes the prefix', () => {
      const { question } = buildAgentSelectionService().selectAgent(
        helpAgentQueston,
        new ExplainOptions(),
        []
      );
      expect(question).toEqual('How to make a diagram?');
    });
  });

  describe('when there are no AppMaps', () => {
    it('creates an Explain agent', () => {
      const { agent, question } = buildAgentSelectionService().selectAgent(
        genericQuestion,
        new ExplainOptions(),
        [
          {
            directory: 'appland',
            appmapConfig: { language: 'ruby' } as unknown as AppMapConfig,
            appmapStats: { numAppMaps: 0 } as unknown as AppMapStats,
          },
        ]
      );
      expect(agent).toBeInstanceOf(ExplainAgent);
      expect(question).toEqual(question);
    });
  });
  describe('when there are AppMaps', () => {
    it('creates an Explain agent', () => {
      const { agent, question } = buildAgentSelectionService().selectAgent(
        genericQuestion,
        new ExplainOptions(),
        [
          {
            directory: 'stripe',
            appmapConfig: { language: 'ruby' } as unknown as AppMapConfig,
            appmapStats: { numAppMaps: 10 } as unknown as AppMapStats,
          },
        ]
      );
      expect(agent).toBeInstanceOf(ExplainAgent);
      expect(question).toEqual(question);
    });
  });
});
