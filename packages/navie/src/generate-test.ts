/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable max-classes-per-file */
import { log } from 'console';
import assert from 'assert';

import { ChatHistory } from './explain';
import { ContextResponse } from './interaction-state';
import VectorTermsService from './services/vector-terms-service';
import CompletionService, { OpenAICompletionService } from './services/completion-service';
import MemoryService from './services/memory-service';
import { ContextRequest } from './context-request';
import InteractionHistory, {
  InteractionEvent,
  InteractionHistoryEvents,
  PromptInteractionEvent,
} from './interaction-history';
import LookupContextService from './services/lookup-context-service';
import ApplyContextService from './services/apply-context-service';

export class GenerateTestOptions {
  modelName = 'gpt-4-0125-preview';
  tokenLimit = 8000;
  temperature = 0.4;
  responseTokens = 1000;
}

export interface GenerateTestRequest {
  question: string;
  appmapDir: string | undefined;
  appmaps: string[] | undefined;
  testExamples: string[];
  requestContext: (request: ContextRequest) => Promise<ContextResponse>;
}

const SYSTEM_PROMPTS = {
  title: `**Task: Generating Test Case Code**`,
  aboutYou: `**About you**

Your job is to generate test case code that matches the behavior of a codebase, based
on a combination of AppMap data, sequence diagram snippets and code snippets.
Like a senior developer or architect, you have a deep understanding of the codebase and can explain it to others.

You are created and maintained by AppMap Inc, and are available to AppMap users as a service.`,
  aboutUser: `**About the user**

The user is a software developer who is generating a test case from a sequence diagram. You can expect the user to
be proficient in software development, but they don't have expertise how this code base works.`,
  theUsersQuestion: `**The test case specification**

The desired test case behavior is prefixed by "Desired test case behavior: ".`,
  theCodeSelection: `**The example test case**

The user provides examples of what the generated test case code should look like, and
what utilities and helpers it may use. The example test cases are prefixed by "Example test case: ".`,
  additionalContext: `**Context information**

You'll be provided with snippets of information including code snippets, database queries,
and sequence diagrams. A different automated agent from yourself has determined this information
to be relevant to the question and optional code selection; it's not provided directly to you by the user.
You should strive to generate the best code you can, based on the information you're provided and your 
own knowledge of software development, languages, frameworks, libraries, tools and best practices.`,
  yourResponse: `**Your response**

1. **Markdown**: Respond using Markdown.

2. **Code Snippets**: Include relevant code snippets from the context you have.
  Ensure that code formatting is consistent and easy to read.

3. **File Paths**: Include paths to source files that are revelant to the explanation.

4. **Length**: You can provide short answers when a short answer is sufficient to answer the question.
  Otherwise, you should provide a long answer.`,
};

type SystemPromptKey = keyof typeof SYSTEM_PROMPTS;

function systemPrompt(): string {
  return Object.keys(SYSTEM_PROMPTS)
    .map((key) => SYSTEM_PROMPTS[key as SystemPromptKey])
    .join('\n\n');
}

export class GenerateTestService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    private readonly completionService: CompletionService,
    private readonly vectorTermsService: VectorTermsService,
    private readonly lookupContextService: LookupContextService,
    private readonly applyContextService: ApplyContextService,
    private readonly memoryService: MemoryService
  ) {}

  async *execute(
    clientRequest: GenerateTestRequest,
    options: GenerateTestOptions,
    chatHistory?: ChatHistory
  ): AsyncIterable<string> {
    const { question, testExamples } = clientRequest;

    this.interactionHistory.addEvent(
      new PromptInteractionEvent('systemPrompt', false, systemPrompt())
    );
    this.interactionHistory.addEvent(
      new PromptInteractionEvent('question', true, question, 'Desired test case behavior: ')
    );
    for (const testExample of testExamples) {
      this.interactionHistory.addEvent(
        new PromptInteractionEvent('outputExample', true, testExample, 'My test example: ')
      );
    }

    if (!chatHistory || chatHistory?.length === 0) {
      const aggregateQuestion = [question, ...testExamples].join('\n\n');

      const vectorTerms = await this.vectorTermsService.suggestTerms(aggregateQuestion);
      if (!vectorTerms || vectorTerms.length === 0) {
        log('No vector terms found');
        yield `I'm sorry, but I don't understand your question. Could you please provide more details or ask in a different way?`;
        return;
      }

      const context = await this.lookupContextService.lookupContext(
        vectorTerms,
        clientRequest.requestContext,
        clientRequest.appmaps,
        clientRequest.appmapDir
      );
      // Context should always be available, because test generation is based on inspecting
      // one particular AppMap which is pre-identified by the user.
      assert(context, 'No context could be obtained');

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

export interface IGenerateTest extends InteractionHistoryEvents {
  execute(): AsyncIterable<string>;
}

export default function generateTest(
  clientRequest: GenerateTestRequest,
  options: GenerateTestOptions,
  chatHistory?: ChatHistory
): IGenerateTest {
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
  const memory = new MemoryService(interactionHistory, options.modelName, options.temperature);

  const testGenerateService = new GenerateTestService(
    interactionHistory,
    completionService,
    vectorTermsService,
    lookupContextService,
    applyContextService,
    memory
  );

  return {
    on: (event: 'event', listener: (event: InteractionEvent) => void) => {
      interactionHistory.on(event, listener);
    },
    execute() {
      return testGenerateService.execute(clientRequest, options, chatHistory);
    },
  };
}
