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
import { ContextProvider } from './context';
import ProjectInfoService from './services/project-info-service';
import { HelpService } from './help';
import { ProjectInfoProvider } from './project-info';

const SYSTEM_PROMPTS = {
  title: `**Task: Explaining Code, Ananlyzing Code, Generating Code**`,
  aboutYou: `**About you**

Your job is to explain code, analyze code, and generate code using a combination of 
AppMap data and code snippets. Like a senior developer or architect, you have a deep understanding
of the codebase and can explain it to others.

You are created and maintained by AppMap Inc, and are available to AppMap users as a service.`,
  aboutUser: `**About the user**

The user is a software developer who is trying to understand, maintain and enhance a codebase. You can
expect the user to be proficient in software development, but they don't have expertise how this code base works.`,
  theUsersQuestion: `**The user's question**

The user's question is prefixed by "My question: ".`,
  theProjectInfo: `**The project information**

Information about the state of the user's project, including the programming language, frameworks, libraries,
tools, and other relevant information. This information is prefixed by "Project info: ".`,
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
`,
};

type SystemPromptKey = keyof typeof SYSTEM_PROMPTS;

function systemPrompt(hasCodeSelection: boolean, hasProjectInfo: boolean): string {
  const excludedSections = new Set();
  if (!hasCodeSelection) excludedSections.add('theCodeSelection');
  if (!hasProjectInfo) excludedSections.add('theProjectInfo');

  const includeSection = (section: string) => !excludedSections.has(section);

  const sectionKeys = Object.keys(SYSTEM_PROMPTS).filter((key) => includeSection(key));
  return sectionKeys.map((key) => SYSTEM_PROMPTS[key as SystemPromptKey]).join('\n\n');
}

export const CHARS_PER_TOKEN = 3.0;

export type ChatHistory = Message[];

export interface ClientRequest {
  question: string;
  codeSelection?: string;
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
    private readonly projectInfoService: ProjectInfoService,
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

    const projectInfo = await this.projectInfoService.lookupProjectInfo();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    async function* help(): AsyncIterable<string> {
      const cachedProjectInfo = new ProjectInfoService(self.interactionHistory, () =>
        Promise.resolve(projectInfo)
      );

      self.interactionHistory.clear();
      const helpService = new HelpService(
        self.interactionHistory,
        self.completionService,
        cachedProjectInfo,
        self.memoryService
      );
      const response = helpService.execute(clientRequest, options);
      for await (const token of response) {
        yield token;
      }
    }

    if (!projectInfo) {
      this.interactionHistory.log('No project info could be obtained');
      for await (const token of help()) {
        yield token;
      }
      return;
    }
    if (!projectInfo['appmap.yml']) {
      this.interactionHistory.log('No appmap.yml file found');
      for await (const token of help()) {
        yield token;
      }
      return;
    }

    this.interactionHistory.addEvent(
      new PromptInteractionEvent(
        'systemPrompt',
        false,
        systemPrompt(Boolean(codeSelection), Boolean(projectInfo))
      )
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
        for await (const token of help()) {
          yield token;
        }
        return;
      }

      const tokensRequested =
        options.tokenLimit - aggregateQuestion.length / CHARS_PER_TOKEN - options.responseTokens;

      const context = await this.lookupContextService.lookupContext({
        vectorTerms,
        tokenCount: tokensRequested,
        type: 'search',
      });

      if (!context) {
        log('No context could be obtained');
        for await (const token of help()) {
          yield token;
        }
        return;
      }

      const tokensRemaining =
        options.tokenLimit -
        aggregateQuestion.length / CHARS_PER_TOKEN -
        options.responseTokens; /* response */
      const charsRemaining = tokensRemaining * 3;

      this.applyContextService.applyContext(context, charsRemaining);
    } else {
      await this.memoryService.predictSummary(chatHistory);
    }

    const response = this.completionService.complete();
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
  contextProvider: ContextProvider,
  projectInfoProvider: ProjectInfoProvider,
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
  const projectInfoService = new ProjectInfoService(interactionHistory, projectInfoProvider);
  const lookupContextService = new LookupContextService(interactionHistory, contextProvider);
  const applyContextService = new ApplyContextService(interactionHistory);
  const memoryService = new MemoryService(
    interactionHistory,
    options.modelName,
    options.temperature
  );

  const codeExplainerService = new CodeExplainerService(
    interactionHistory,
    completionService,
    projectInfoService,
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
