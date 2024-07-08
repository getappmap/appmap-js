import DiagramAgent from '../../src/agents/diagram-agent';
import ExplainAgent from '../../src/agents/explain-agent';
import HelpAgent from '../../src/agents/help-agent';
import InteractionHistory, { AgentSelectionEvent } from '../../src/interaction-history';
import { UserOptions } from '../../src/lib/parse-options';
import AgentSelectionService from '../../src/services/agent-selection-service';
import ApplyContextService from '../../src/services/apply-context-service';
import CompletionService from '../../src/services/completion-service';
import LookupContextService from '../../src/services/lookup-context-service';
import TechStackService from '../../src/services/tech-stack-service';
import VectorTermsService from '../../src/services/vector-terms-service';

describe('AgentSelectionService', () => {
  let interactionHistory: InteractionHistory;
  let vectorTermsService: VectorTermsService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let techStackService: TechStackService;
  let completionService: CompletionService;
  let genericQuestion = 'How does user management work?';
  let helpAgentQueston = '@help How to make a diagram?';
  const emptyUserOptions = new UserOptions(new Map());

  function buildAgentSelectionService() {
    return new AgentSelectionService(
      interactionHistory,
      vectorTermsService,
      lookupContextService,
      applyContextService,
      techStackService,
      completionService
    );
  }

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    vectorTermsService = {} as VectorTermsService;
    lookupContextService = {} as LookupContextService;
    applyContextService = {} as ApplyContextService;
    techStackService = {} as TechStackService;
    completionService = {} as CompletionService;
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

  describe('when the question is classified as generate-diagram', () => {
    it('creates a Diagram agent', () => {
      const { agent } = buildAgentSelectionService().selectAgent(
        genericQuestion,
        [
          {
            name: 'generate-diagram',
            weight: 'high',
          },
        ],
        emptyUserOptions
      );
      expect(agent).toBeInstanceOf(DiagramAgent);
    });
  });

  describe('when the question is classified as explain', () => {
    it('creates an Explain agent even if other classifiers are present', () => {
      const { agent } = buildAgentSelectionService().selectAgent(
        genericQuestion,
        [
          {
            name: 'generate-diagram',
            weight: 'high',
          },
          {
            name: 'help-with-appmap',
            weight: 'high',
          },
          {
            name: 'explain',
            weight: 'high',
          },
        ],
        emptyUserOptions
      );
      expect(agent).toBeInstanceOf(ExplainAgent);
    });
  });
});
