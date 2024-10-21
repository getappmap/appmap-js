import InteractionHistory, { PromptInteractionEvent } from '../../src/interaction-history';
import { AgentOptions } from '../../src/agent';
import ContextService from '../../src/services/context-service';
import DiagramAgent, { DIAGRAM_AGENT_PROMPT } from '../../src/agents/diagram-agent';
import { UserOptions } from '../../src/lib/parse-options';
import MermaidFixerService from '../../src/services/mermaid-fixer-service';
import { DIAGRAM_FORMAT_PROMPT } from '../../src/agents/explain-agent';

describe('@diagram agent', () => {
  let interactionHistory: InteractionHistory;
  let contextService: ContextService;
  let mermaidFixerService: MermaidFixerService;
  let tokensAvailable: number;

  const initialQuestionOptions = new AgentOptions(
    'How does user management work?',
    'How does user management work?',
    new UserOptions(new Map()),
    [],
    [
      {
        directory: 'twitter',
        appmapConfig: {
          language: 'ruby',
          name: 'test',
          appmap_dir: 'tmp/appmap',
          packages: undefined,
        },
        appmapStats: { numAppMaps: 1, packages: [], routes: [], tables: [] },
      },
    ]
  );

  beforeEach(() => {
    tokensAvailable = 1000;
    interactionHistory = new InteractionHistory();
    contextService = {
      searchContext: jest.fn(),
    } as unknown as ContextService;
    mermaidFixerService = {
      repairDiagram: jest.fn(),
    } as unknown as MermaidFixerService;
  });

  afterEach(() => jest.restoreAllMocks());

  it('should perform the diagram agent task', async () => {
    const diagramAgent = new DiagramAgent(interactionHistory, contextService, mermaidFixerService);
    const result = await diagramAgent.perform(initialQuestionOptions, () => tokensAvailable);

    // Verify that the perform method writes the correct prompt interactions to the history
    expect(interactionHistory.events).toContainEqual(
      new PromptInteractionEvent(
        'agent',
        'system',
        [DIAGRAM_AGENT_PROMPT, DIAGRAM_FORMAT_PROMPT].join('\n\n')
      )
    );
    expect(interactionHistory.events).toContainEqual(
      expect.objectContaining({
        name: 'question',
        role: 'system',
        type: 'prompt',
      })
    );

    // Verify that the context service's perform method is called with the expected options
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(contextService.searchContext).toHaveBeenCalledWith(
      initialQuestionOptions,
      expect.any(Function)
    );

    // Verify that the result returned by the perform method is as expected
    expect(result).toEqual({ response: 'Rendering diagram...\n', abort: false });
  });
});
