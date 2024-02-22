/* eslint-disable max-classes-per-file */
import { log } from 'console';

import Message from './message';
import MemoryService from './services/memory-service';
import VectorTermsService from './services/vector-terms-service';
import CompletionService, { OpenAICompletionService } from './services/completion-service';
import InteractionHistory, {
  InteractionEvent,
  InteractionHistoryEvents,
  PromptInteractionEvent,
} from './interaction-history';
import LookupContextService from './services/lookup-context-service';
import ApplyContextService from './services/apply-context-service';
import { ContextRequest } from './context-request';
import { ContextResponse } from './interaction-state';

const SYSTEM_PROMPTS = {
  title: `**Task: Explaining Code, Ananlyzing Code, Generating Code**`,
  aboutYou: `**About you**

Your job is to explain code, analyze code, and generate code using a combination of 
AppMap data and code snippets. Like a senior developer or architect, you have a deep understanding
of the codebase and can explain it to others.

You are created and maintained by AppMap Inc, and are available to AppMap users as a service.`,
  aboutUser: `**About the user**

The user is a software developer who is trying to understand a codebase. You can expect the user to
be proficient in software development, but they don't have expertise how this code base works.`,
  theUsersQuestion: `**The user's question**

The user's question is prefixed by "My question: ".`,
  theCodeSelection: `**The code selection**

The user is asking about specific lines of code that they have selected in their 
code editor. This code selection is prefixed by "My code selection: ".`,
  additionalContext: `**Additional context information provided by another agent**

You'll be provided with snippets of information including code snippets, database queries,
and sequence diagrams. A different automated agent from yourself has determined this information
to be relevant to the question and optional code selection; it's not provided directly to you by the user.
You should strive to give the best answer you can, based on the information you're provided and your 
own knowledge of software development, languages, frameworks, libraries, tools and best practices.

The additional context information is provided as context for answering the user's question. It should 
be used only as the context for answering the user's question, and not as the question itself.`,
  yourResponse: `**Your response**

1. **Markdown**: Respond using Markdown.

2. **Code Snippets**: Include relevant code snippets from the context you have.
  Ensure that code formatting is consistent and easy to read.

3. **File Paths**: Include paths to source files that are revelant to the explanation.

4. **Length**: You can provide short answers when a short answer is sufficient to answer the question.
  Otherwise, you should provide a long answer.
  
**User confusion about your purpose**

If the user asks you to draw a sequence diagram, explain to them what your purpose is, and suggest
that they ask a question about a particular aspect of their code. Explain to the user that they
can find the AppMap sequence diagrams in the AppMap extension panel of their code editor.
`,
};

type SystemPromptKey = keyof typeof SYSTEM_PROMPTS;

function systemPrompt(hasCodeSelection: boolean): string {
  const includeSection = (section: string) => section !== 'theCodeSelection' || hasCodeSelection;

  const sectionKeys = Object.keys(SYSTEM_PROMPTS).filter((key) => includeSection(key));
  return sectionKeys.map((key) => SYSTEM_PROMPTS[key as SystemPromptKey]).join('\n\n');
}

export type ChatHistory = Message[];

export interface ClientRequest {
  question: string;
  codeSelection?: string;
  requestContext: (request: ContextRequest) => Promise<ContextResponse>;
}

export class ExplainOptions {
  modelName = 'gpt-4-0125-preview';
  tokenLimit = 8000;
  temperature = 0.4;
  responseTokens = 1000;
}

export class CodeExplainerService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    private readonly completionService: CompletionService,
    private readonly vectorTermsService: VectorTermsService,
    private readonly lookupContextService: LookupContextService,
    private readonly applyContextService: ApplyContextService,
    private readonly memoryService: MemoryService
  ) {}

  async *execute(
    clientRequest: ClientRequest,
    options: ExplainOptions,
    chatHistory?: ChatHistory
  ): AsyncIterable<string> {
    const { question, codeSelection } = clientRequest;

    this.interactionHistory.addEvent(
      new PromptInteractionEvent('systemPrompt', false, systemPrompt(Boolean(codeSelection)))
    );
    this.interactionHistory.addEvent(
      new PromptInteractionEvent('question', false, question, 'My question: ')
    );
    if (codeSelection) {
      this.interactionHistory.addEvent(
        new PromptInteractionEvent('codeSelection', false, codeSelection, 'My code selection: ')
      );
    }

    if (!chatHistory || chatHistory?.length === 0) {
      const aggregateQuestion = [question, codeSelection].filter(Boolean).join('\n\n');

      const vectorTerms = await this.vectorTermsService.suggestTerms(aggregateQuestion);
      if (!vectorTerms || vectorTerms.length === 0) {
        log('No vector terms found');
        yield `I'm sorry, but I don't understand your question. Could you please provide more details or ask in a different way?`;
        return;
      }

      const context = await this.lookupContextService.lookupContext(
        vectorTerms,
        clientRequest.requestContext
      );

      if (!context) {
        log('No context could be obtained');
        yield `I'm not able to identify any AppMaps in your project that are relevant to your question. Record more AppMaps and try again.`;
        return;
      }

      const tokensRemaining =
        options.tokenLimit - aggregateQuestion.length - options.responseTokens; /* response */
      const charsRemaining = tokensRemaining * 3;

      this.applyContextService.applyContext(context, charsRemaining);
    } else {
      await this.memoryService.predictSummary(chatHistory);
    }

    const response = this.completionService.complete({});

    for await (const token of response) {
      yield token;
    }
  }
}

export interface IExplain extends InteractionHistoryEvents {
  execute(): AsyncIterable<string>;
}

export default function explain(
  clientRequest: ClientRequest,
  options: ExplainOptions,
  chatHistory?: ChatHistory
): IExplain {
  const interactionHistory = new InteractionHistory();
  const completionService = new OpenAICompletionService(
    interactionHistory,
    options.modelName,
    options.temperature
  );
  const vectorTermsService = new VectorTermsService(
    interactionHistory,
    options.modelName,
    options.temperature
  );
  const lookupContextService = new LookupContextService(interactionHistory);
  const applyContextService = new ApplyContextService(interactionHistory);
  const memoryService = new MemoryService(
    interactionHistory,
    options.modelName,
    options.temperature
  );

  const codeExplainerService = new CodeExplainerService(
    interactionHistory,
    completionService,
    vectorTermsService,
    lookupContextService,
    applyContextService,
    memoryService
  );

  return {
    on: (event: 'event', listener: (event: InteractionEvent) => void) => {
      interactionHistory.on(event, listener);
    },
    execute() {
      return codeExplainerService.execute(clientRequest, options, chatHistory);
    },
  };
}
