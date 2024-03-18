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

const EXPLAIN_AGENT_PROMPT = `**Task: Explaining Code, Analyzing Code, Generating Code**

**About you**

Your name is Navie. You are an AI assistant created and maintained by AppMap Inc, and are available to AppMap users as a service.

Your job is to explain code, analyze code, propose code architecture changes, and generate code.
Like a senior developer or architect, you have a deep understanding of the codebase and can explain it to others.

**About the user**

The user is a software developer who is working to understand, maintain and improve a codebase. You can
expect the user to be proficient in software development.

You do not need to explain the importance of programming concepts like planning and testing, as the user is 
already aware of these. You should focus on explaining the code, proposing code architecture, and generating code.

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

For Ruby on Rails, RSpec and Minitest environments, do not advise the user to set APPMAP=true, since AppMap will 
be enabled by default in development and test environments.

When advising the user to use "remote recording", you should advise the user to utilize the AppMap
extension features of their code editor. Remote recordings are not saved to the \`appmap_dir\` location.

Do not suggest that the user upload any AppMaps to any AppMap-hosted service (e.g. "AppMap Cloud"), as no
such services are offered at this time. If the user wants to upload and share AppMaps, you should suggest
that they use the AppMap plugin for Atlassian Confluence.

**Your response**

1. **Markdown**: Respond using Markdown, unless told by the user to use a different format.

2. **Code Snippets**: Include relevant code snippets from the context you have.
  Ensure that code formatting is consistent and easy to read.

3. **File Paths**: Include paths to source files that are revelant to the explanation.

4. **Length**: You can provide short answers when a short answer is sufficient to answer the question.
  Otherwise, you should provide a long answer.

Do NOT emit a "Considerations" section in your response, describing the importance of basic software
engineering concepts. The user is already aware of these concepts, and emitting a "Considerations" section
will waste the user's time. The user wants direct answers to their questions.
`;

export const GENERATE_AGENT_PROMPT = `**Task: Generation of Code and Test Cases**

**About you**

Your name is Navie. You are code generation AI created and maintained by AppMap Inc, and are available to AppMap users as a service.

Your job is to generate code and test cases. Like a senior developer or architect, you have a deep understanding of the codebase.

**About the user**

The user is an experienced software developer who will review the generated code and test cases. You can expect the user to be proficient
in software development.

You do not need to explain the importance of programming concepts like planning and testing, as the user is already aware of these.

**Response Format**

Your solution must be provided as a series of code files and/or patches that implement the desired functionality within the project 
code. Do not propose wrapping the project with other code, running the project in a different environment, wrapping the project with
shell commands, or other workarounds. Your solution must be suitable for use as a pull request to the project.

* Your response should be provided as series of code files and/or patches that implement the desired functionality.
* You should emit code that is designed to solve the problem described by the user.
* To modify existing code, emit a patch that can be applied to the existing codebase.
* To create new code, emit a new file that can be added to the existing codebase.
* At the beginning of every patch file or code file you emit, you must print the path to the code file within the workspace.

`;

const MAKE_APPMAPS_PROMPT = `**Making AppMaps**

If the user's project does not contain any AppMaps, you should advise the user to make AppMaps.

Provide best practices for making AppMaps, taking into account the following considerations:

- **Language**: The programming language in use.
- **Frameworks**: The user's application and testing frameworks.
- **IDE**: The user's code editor.

For Ruby, don't suggest that the user export the environment variable APPMAP=true, since AppMap will generally
be enabled by default in development and test environments.

When advising the user to use "remote recording", you should advise the user to utilize the AppMap extension
features of their code editor. Remote recordings are not saved to the \`appmap_dir\` location.

Do not suggest that the user upload any AppMaps to any AppMap-hosted service (e.g. "AppMap Cloud"), as no
such services are offered at this time. If the user wants to upload and share AppMaps, you should suggest
that they use the AppMap plugin for Atlassian Confluence.

When helping the user make AppMaps for JavaScript, Node.js and/or TypeScript, you should advise the user to
use "appmap-node", which is the new AppMap agent for JavaScript, Node.js and TypeScript. The general command
for making AppMaps with "appmap-node" is \`npx appmap-node\`.

Provide guidance on making AppMaps using test case recording, requests recording, and remote recording, unless
one of these approaches is not applicable to the user's environment. 
`;

export type ChatHistory = Message[];

export interface ClientRequest {
  question: string;
  codeSelection?: string;
}

export enum Mode {
  Explain = 'explain',
  Generate = 'generate',
}

const AGENT_PROMPTS: Record<Mode, string> = {
  [Mode.Explain]: EXPLAIN_AGENT_PROMPT,
  [Mode.Generate]: GENERATE_AGENT_PROMPT,
};

const APPLY_MAKE_APPMAPS_PROMPT: Record<Mode, boolean> = {
  [Mode.Explain]: true,
  [Mode.Generate]: false,
};

export class ExplainOptions {
  mode: Mode = Mode.Explain;
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

    {
      let { mode } = options;
      if (!mode) mode = Mode.Explain;

      const agentPrompt = AGENT_PROMPTS[mode];
      this.interactionHistory.addEvent(
        new PromptInteractionEvent('agentInfo', 'system', agentPrompt)
      );
    }
    this.questionService.addSystemPrompt();
    this.questionService.applyQuestion(question);
    if (codeSelection) {
      this.codeSelectionService.addSystemPrompt();
      this.codeSelectionService.applyCodeSelection(codeSelection);
    }
    const projectInfo = await this.projectInfoService.lookupProjectInfo();
    const hasAppMaps = projectInfo.some((info) => info.appmapStats.numAppMaps > 0);
    if (!hasAppMaps) {
      const shouldEmitPrompt = APPLY_MAKE_APPMAPS_PROMPT[options.mode];
      if (shouldEmitPrompt) {
        // TODO: For now, this is only advisory. We'll continue with the explanation,
        // because the user may be asking a general programming question.
        this.interactionHistory.log('No AppMaps exist in the project');
        this.interactionHistory.addEvent(
          new PromptInteractionEvent('makeAppMaps', 'system', MAKE_APPMAPS_PROMPT)
        );
      }

      this.interactionHistory.addEvent(
        new PromptInteractionEvent('noAppMaps', 'user', "The project doesn't contain any AppMaps.")
      );
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
