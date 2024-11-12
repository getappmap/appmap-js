import { Agent, AgentOptions } from '../agent';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import ContextService from '../services/context-service';

export const SEARCH_AGENT_PROMPT = `**Task: Search**

**About you**

Your name is Navie. Your job is to provide help using AppMap. You are an expert user of AppMap, and you have
access to the AppMap documentation that's relevant to the user's question.

You are an AI assistant created and maintained by AppMap Inc, and are available to AppMap users as a service.

**About the user**

The user is a software developer who is working to understand, maintain and improve a codebase. You can
expect the user to be proficient in software development.

**About your response**

Your response should be a list of locations in the codebase that are most relevant to the user's question.
`;

export const SEARCH_AGENT_FORMAT = `**Response format**

Your response should be a list of links to files in the codebase that are relevant to the user's question.

The links should be formatted as Markdown links, like this:

* [full/path/to/file1](file:///full/path/to/file1) This file is relevant to the user's question because...
  Some classes, modules, or functions that are relevant to the user's question are...
* [relative/path/to/file2](file:///relative/path/to/file2) This file is relevant to the user's question because...
  Some classes, modules, or functions that are relevant to the user's question are...
`;

export default class SearchAgent implements Agent {
  public temperature = 0;

  constructor(public history: InteractionHistory, private contextService: ContextService) {}

  async perform(options: AgentOptions, tokensAvailable: () => number): Promise<void> {
    const agentPrompt = [SEARCH_AGENT_PROMPT];
    // With the /noformat option, the user will explain the desired output format in their message.
    if (options.userOptions.isEnabled('format', true)) {
      agentPrompt.push(SEARCH_AGENT_FORMAT);
    }

    this.history.addEvent(new PromptInteractionEvent('agent', 'system', agentPrompt.join('\n\n')));

    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.Question,
        'system',
        buildPromptDescriptor(PromptType.Question)
      )
    );

    await this.contextService.locationContextFromOptions(options);
    await this.contextService.searchContext(options, tokensAvailable);
  }

  applyQuestionPrompt(question: string): void {
    const prompt = [question, 'Do not generate code.'].join('\n\n');

    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.ProblemStatement,
        'user',
        buildPromptValue(PromptType.ProblemStatement, prompt)
      )
    );
  }
}
