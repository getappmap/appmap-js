import ExplainAgent from '../../src/agents/explain-agent';
import HelpAgent from '../../src/agents/help-agent';
import { ContextV2 } from '../../src/context';
import InteractionHistory, { AgentSelectionEvent } from '../../src/interaction-history';
import { UserOptions } from '../../src/lib/parse-options';
import AgentSelectionService from '../../src/services/agent-selection-service';
import ApplyContextService from '../../src/services/apply-context-service';
import FileChangeExtractorService from '../../src/services/file-change-extractor-service';
import LookupContextService from '../../src/services/lookup-context-service';
import MermaidFixerService from '../../src/services/mermaid-fixer-service';
import VectorTermsService from '../../src/services/vector-terms-service';

describe('AgentSelectionService', () => {
  let interactionHistory: InteractionHistory;
  let vectorTermsService: VectorTermsService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let fileChangeExtractorService: FileChangeExtractorService;
  let mermaidFixerService: MermaidFixerService;
  const genericQuestion = 'How does user management work?';
  const helpAgentQueston = '@help How to make a diagram?';
  const emptyUserOptions = new UserOptions(new Map());

  function buildAgentSelectionService() {
    return new AgentSelectionService(
      interactionHistory,
      vectorTermsService,
      lookupContextService,
      fileChangeExtractorService,
      applyContextService,
      mermaidFixerService
    );
  }

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    vectorTermsService = {} as VectorTermsService;
    lookupContextService = {} as LookupContextService;
    fileChangeExtractorService = {} as FileChangeExtractorService;
    applyContextService = {} as ApplyContextService;
    mermaidFixerService = {} as MermaidFixerService;
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
      invokeAgent();
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
    it('creates an explain agent', () => {
      const { agent } = buildAgentSelectionService().selectAgent(
        genericQuestion,
        [
          {
            name: ContextV2.ContextLabelName.HelpWithAppMap,
            weight: ContextV2.ContextLabelWeight.High,
          },
        ],
        emptyUserOptions
      );
      expect(agent).toBeInstanceOf(ExplainAgent);
    });
  });
});
