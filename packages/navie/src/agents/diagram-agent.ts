import { Agent, AgentOptions } from '../agent';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import MermaidFilter from '../lib/mermaid-filter';
import { buildPromptValue, PROMPTS, PromptType } from '../prompt';
import ContextService from '../services/context-service';
import MermaidFixerService from '../services/mermaid-fixer-service';
import { DIAGRAM_FORMAT_PROMPT } from './explain-agent';

export const DIAGRAM_AGENT_PROMPT = `**Task: Generation of Software Diagrams**

**About you**

Your name is Navie. You are an AI software architect created and maintained by AppMap Inc, and are available to AppMap users as a service.
Your job is to generate software diagrams based on a description provided by the user.

**About the user**
The user is an experienced software developer who will review the diagrams you generate, and use them
to understand the code and design code solutions. You can expect the user to be proficient in software development.
`;

const DEFAULT_QUESTION = 'Create a diagram from the information available.';

export default class DiagramAgent implements Agent {
  public temperature = undefined;

  constructor(
    public history: InteractionHistory,
    private contextService: ContextService,
    private mermaidFixerService: MermaidFixerService
  ) {}

  get filter() {
    const f = new MermaidFilter(this.history, this.mermaidFixerService);
    return f.transform.bind(f);
  }

  async perform(options: AgentOptions, tokensAvailable: () => number): Promise<void> {
    const agentPrompt = [DIAGRAM_AGENT_PROMPT];
    // With the /noformat option, the user will explain the desired output format in their message.
    if (options.userOptions.isEnabled('format', true)) {
      agentPrompt.push(DIAGRAM_FORMAT_PROMPT);
    }
    this.history.addEvent(new PromptInteractionEvent('agent', 'system', agentPrompt.join('\n\n')));

    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.Question,
        'system',
        PROMPTS[PromptType.Question].content
      )
    );

    await this.contextService.locationContextFromOptions(options);
    await this.contextService.searchContext(options, tokensAvailable);
  }

  applyQuestionPrompt(question: string): void {
    this.history.addEvent(
      new PromptInteractionEvent(PromptType.Question, 'user', question.trim() || DEFAULT_QUESTION)
    );
  }
}
