/* eslint-disable max-classes-per-file */
import Message, { CHARACTERS_PER_TOKEN } from './message';
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
import { ContextProvider, ContextResponse } from './context';
import ProjectInfoService from './services/project-info-service';
import { ProjectInfoProvider } from './project-info';
import CodeSelectionService from './services/code-selection-service';
import QuestionService from './services/question-service';

const AGENT_INFO_PROMPT = `**Task: Explaining Code, Analyzing Code, Generating Code**

**About you**

Your job is to explain code, analyze code, and generate code using a combination of 
AppMap data and code snippets. Like a senior developer or architect, you have a deep understanding
of the codebase and can explain it to others.

You are created and maintained by AppMap Inc, and are available to AppMap users as a service.

**About the user**

The user is a software developer who is trying to understand, maintain and enhance a codebase. You can
expect the user to be proficient in software development, but they don't have expertise how this code base works.

You do not need to explain the importance of planning and testing, as the user is already aware of these
concepts. You should focus on explaining the code and generating code.

**Providing help with AppMap**

If the user needs assistance with making AppMaps, you should direct them based on the language in use:

- **Ruby** - https://appmap.io/docs/reference/appmap-ruby
- **Python** - https://appmap.io/docs/reference/appmap-python
- **Java** - https://appmap.io/docs/reference/appmap-java
- **JavaScript, Node.js and TypeScript** - https://appmap.io/docs/reference/appmap-node

\`appmap-node\` is the new AppMap agent for JavaScript, Node.js and TypeScript. To use it to make AppMaps, the
user runs their command with the prefix \`npx appmap-node\`.

Your guidance should be directed towards using AppMap in the developer's local environment, such as
their code editor. Don't suggest configuration of production systems unless the user specifically asks
about that. If the user asks about configuration of AppMap in production, make sure you include an advisory
about the security and data protection implications of recording AppMaps in production.

For Ruby environments, you do not generally need to advise the user to export the environment variable
APPMAP=true, since AppMap will generally be enabled by default in development and test environments.

When advising the user to use "remote recording", you should advise the user to utilize the AppMap
extension features of their code editor. Remote recordings are not saved to the \`appmap_dir\` location.

Do not suggest that the user upload any AppMaps to any AppMap-hosted service (e.g. "AppMap Cloud"), as no
such services are offered at this time. If the user wants to upload and share AppMaps, you should suggest
that they use the AppMap plugin for Atlassian Confluence.

**Your response**

1. **Markdown**: Respond using Markdown.

2. **Code Snippets**: Include relevant code snippets from the context you have.
  Ensure that code formatting is consistent and easy to read.

3. **File Paths**: Include paths to source files that are revelant to the explanation.

4. **Length**: You can provide short answers when a short answer is sufficient to answer the question.
  Otherwise, you should provide a long answer.

Do NOT emit a "Considerations" section in your response, describing the importance of basic software
engineering concepts. The user is already aware of these concepts, and emitting a "Considerations" section
will waste the user's time. The user wants direct answers to their questions.
`;

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
    private readonly questionService: QuestionService,
    private readonly codeSelectionService: CodeSelectionService,
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
    const tokensAvailable = (): number =>
      options.tokenLimit - options.responseTokens - this.interactionHistory.computeTokenSize();

    this.interactionHistory.addEvent(
      new PromptInteractionEvent('agentInfo', 'system', AGENT_INFO_PROMPT)
    );
    this.questionService.addSystemPrompt();
    this.questionService.applyQuestion(question);
    if (codeSelection) {
      this.codeSelectionService.addSystemPrompt();
      this.codeSelectionService.applyCodeSelection(codeSelection);
    }
    const projectInfo = await this.projectInfoService.lookupProjectInfo();

    const hasAppMaps =
      projectInfo.appmapStats?.numAppMaps && projectInfo.appmapStats.numAppMaps > 0;
    if (!hasAppMaps) {
      // TODO: For now, this is only advisory. We'll continue with the explanation,
      // because the user may be asking a general programming question.
      this.interactionHistory.log('No AppMaps exist in the project');
    }

    let context: ContextResponse | undefined;
    if (hasAppMaps) {
      const aggregateQuestion = [
        question,
        ...(chatHistory || [])
          .filter((message) => message.role === 'user')
          .map((message) => message.content),
        codeSelection,
      ]
        .filter(Boolean)
        .join('\n\n');

      const vectorTerms = await this.vectorTermsService.suggestTerms(aggregateQuestion);
      context = await this.lookupContextService.lookupContext({
        vectorTerms,
        tokenCount: tokensAvailable(),
        type: 'search',
      });
      if (context) {
        this.applyContextService.addSystemPrompts(context);

        this.applyContextService.applyContext(context, tokensAvailable() * CHARACTERS_PER_TOKEN);
      }
    }

    const hasChatHistory = chatHistory && chatHistory.length > 0;
    if (hasChatHistory) {
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
  const questionService = new QuestionService(interactionHistory);
  const codeSelectionService = new CodeSelectionService(interactionHistory);
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
    questionService,
    codeSelectionService,
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
