import InteractionHistory, { PromptInteractionEvent } from '../../src/interaction-history';
import { AgentOptions } from '../../src/agent';
import ContextService from '../../src/services/context-service';
import CompletionService from '../../src/services/completion-service';
import DiagramAgent, { DIAGRAM_AGENT_PROMPT } from '../../src/agents/diagram-agent';
import { UserOptions } from '../../src/lib/parse-options';

describe('@diagram agent', () => {
  let interactionHistory: InteractionHistory;
  let contextService: ContextService;
  let tokensAvailable: number;

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

  beforeEach(async () => {
    tokensAvailable = 1000;
    interactionHistory = new InteractionHistory();
    contextService = {
      perform: jest.fn(),
    } as unknown as ContextService;
  });

  afterEach(() => jest.restoreAllMocks());

  it('should perform the diagram agent task', async () => {
    const completionService = {
      perform: jest.fn(),
    } as unknown as CompletionService;

    const diagramAgent = new DiagramAgent(interactionHistory, contextService, completionService);
    const result = await diagramAgent.perform(initialQuestionOptions, () => tokensAvailable);

    // Verify that the perform method writes the correct prompt interactions to the history
    expect(interactionHistory.events).toContainEqual(
      new PromptInteractionEvent('agent', 'system', DIAGRAM_AGENT_PROMPT)
    );
    expect(interactionHistory.events).toContainEqual(
      expect.objectContaining({
        name: 'question',
        role: 'system',
        type: 'prompt',
      })
    );

    // Verify that the context service's perform method is called with the expected options
    expect(contextService.perform).toHaveBeenCalledWith(
      initialQuestionOptions,
      expect.any(Function)
    );

    // Verify that the result returned by the perform method is as expected
    expect(result).toEqual({ response: 'Rendering diagram...\n', abort: false });
  });
});
