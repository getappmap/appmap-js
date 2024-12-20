import { z } from 'zod';

import { Agent, AgentOptions } from '../agent';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import ContextService from '../services/context-service';
import applyFormat from '../lib/apply-format';

export const SEARCH_AGENT_PROMPT = `**Task: Search**

**About you**

Your name is Navie. Your job is to provide help using AppMap. You are an expert user of AppMap, and you have
access to the AppMap documentation that's relevant to the user's question.

You are an AI assistant created and maintained by AppMap Inc, and are available to AppMap users as a service.

**About the user**

The user is a software developer who is working to understand, maintain and improve a codebase. You can
expect the user to be proficient in software development.

**About your response**

Your response should be a list of locations in the codebase that are most relevant to the user's question,
along with a description for each location that explains why it's relevant.

The locations in your response should be selected from files in the codebase that are relevant to the user's
question. These locations are provided as code snippets with associated locations.
`;

export const SEARCH_AGENT_FORMAT = `**Response format**

The links should be formatted as Markdown links, like this:

* [full/path/to/file1](file:///full/path/to/file1) This file is relevant to the user's question because...
  Some classes, modules, or functions that are relevant to the user's question are...
* [relative/path/to/file2](file:///relative/path/to/file2) This file is relevant to the user's question because...
  Some classes, modules, or functions that are relevant to the user's question are...
`;

const SCHEMA = z.object({
  searchResults: z.array(
    z
      .object({
        location: z
          .string()
          .describe('The location of the relevant code file, search result, or snippet'),
        description: z.string().describe('A description of why the location is relevant'),
      })
      .describe(
        "A location in the codebase that is relevant to the user's question, along with a description of why it's relevant"
      )
  ),
});

export default class SearchAgent implements Agent {
  public temperature = 0.05;

  constructor(public history: InteractionHistory, private contextService: ContextService) {}

  async perform(options: AgentOptions, tokensAvailable: () => number): Promise<void> {
    this.history.addEvent(new PromptInteractionEvent('agent', 'system', SEARCH_AGENT_PROMPT));

    applyFormat(this.history, options.userOptions, SEARCH_AGENT_FORMAT, SCHEMA, []);

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
