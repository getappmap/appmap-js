import ExplainAgent from '../../src/agents/explain-agent';
import { ExplainOptions } from '../../src/explain';
import InteractionHistory from '../../src/interaction-history';
import { AppMapConfig, AppMapStats } from '../../src/project-info';
import AgentSelectionService from '../../src/services/agent-selection-service';
import ApplyContextService from '../../src/services/apply-context-service';
import LookupContextService from '../../src/services/lookup-context-service';
import VectorTermsService from '../../src/services/vector-terms-service';

describe('AgentSelectionService', () => {
  let interactionHistory: InteractionHistory;
  let vectorTermsService: VectorTermsService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let genericQuestion = 'How does user management work?';
  function buildAgentSelectionService() {
    return new AgentSelectionService(
      interactionHistory,
      vectorTermsService,
      lookupContextService,
      applyContextService
    );
  }

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    vectorTermsService = {} as VectorTermsService;
    lookupContextService = {} as LookupContextService;
    applyContextService = {} as ApplyContextService;
  });

  describe('when there are AppMaps', () => {
    it('creates an Explain agent', () => {
      const { agent, question } = buildAgentSelectionService().selectAgent(
        genericQuestion,
        new ExplainOptions(),
        [
          {
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
