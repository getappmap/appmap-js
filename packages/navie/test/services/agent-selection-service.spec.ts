import ExplainAgent from '../../src/agents/explain-agent';
import HelpAgent from '../../src/agents/help-agent';
import InteractionHistory, { AgentSelectionEvent } from '../../src/interaction-history';
import { UserOptions } from '../../src/lib/parse-options';
import AgentSelectionService from '../../src/services/agent-selection-service';
import ApplyContextService from '../../src/services/apply-context-service';
import LookupContextService from '../../src/services/lookup-context-service';
import TechStackService from '../../src/services/tech-stack-service';
import VectorTermsService from '../../src/services/vector-terms-service';

describe('AgentSelectionService', () => {
  let interactionHistory: InteractionHistory;
  let vectorTermsService: VectorTermsService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let techStackService: TechStackService;
  let genericQuestion = 'How does user management work?';
  let helpAgentQueston = '@help How to make a diagram?';
  const emptyUserOptions = new UserOptions(new Map());

  function buildAgentSelectionService() {
    return new AgentSelectionService(
      interactionHistory,
      vectorTermsService,
      lookupContextService,
      applyContextService,
      techStackService
    );
  }

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    vectorTermsService = {} as VectorTermsService;
    lookupContextService = {} as LookupContextService;
    applyContextService = {} as ApplyContextService;
    techStackService = {} as TechStackService;
  });

  const agentSelectionEvent = (): AgentSelectionEvent | undefined =>
    interactionHistory.events.find((event) => event instanceof AgentSelectionEvent) as any;

  describe('when the question specifies an agent', () => {
    const invokeAgent = () =>
      buildAgentSelectionService().selectAgent(helpAgentQueston, [], emptyUserOptions);

    it('creates the specified agent', () => {
      const { agent } = invokeAgent();
      expect(agent).toBeInstanceOf(HelpAgent);
    });
    it('emits the agent selection event', () => {
      const { agent } = invokeAgent();
      expect(agentSelectionEvent()?.metadata).toEqual({
        agent: 'help',
        type: 'agentSelection',
      });
    });
    it('removes the prefix', () => {
      const { question } = invokeAgent();
      expect(question).toEqual('How to make a diagram?');
    });
  });

  describe('by default', () => {
    it('creates an Explain agent', () => {
      const { agent, question } = buildAgentSelectionService().selectAgent(
        genericQuestion,
        [],
        emptyUserOptions
      );
      expect(agent).toBeInstanceOf(ExplainAgent);
      expect(question).toEqual(question);
    });
  });

  describe('when the question is classified as help-with-appmap', () => {
    it('creates a Help agent', () => {
      const { agent } = buildAgentSelectionService().selectAgent(
        genericQuestion,
        [
          {
            name: 'help-with-appmap',
            weight: 'high',
          },
        ],
        emptyUserOptions
      );
      expect(agent).toBeInstanceOf(HelpAgent);
    });

    describe('but /nohelp is specified', () => {
      it('creates an Explain agent', () => {
        const { agent } = buildAgentSelectionService().selectAgent(
          genericQuestion,
          [
            {
              name: 'help-with-appmap',
              weight: 'high',
            },
          ],
          new UserOptions(new Map([['help', false]]))
        );
        expect(agent).toBeInstanceOf(ExplainAgent);
      });
    });
  });
});
