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
import { ExplainMode, GenerateMode, IMode, Mode } from './mode';

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

export class ExplainOptions {
  mode?: Mode;
  modelName = 'gpt-4-0125-preview';
  tokenLimit = 8000;
  temperature = 0.4;
  responseTokens = 1000;
}

export class CodeExplainerService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    private readonly completionService: CompletionService,
    private readonly mode: IMode,
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

    this.mode.applyAgentSystemPrompt();
    this.mode.applyQuestionSystemPrompt();
    this.mode.applyQuestionPrompt(question);

    if (codeSelection) {
      this.codeSelectionService.addSystemPrompt();
      this.codeSelectionService.applyCodeSelection(codeSelection);
    }

    const projectInfo = await this.projectInfoService.lookupProjectInfo();
    const hasAppMaps = projectInfo.some((info) => info.appmapStats.numAppMaps > 0);
    if (!hasAppMaps) {
      // TODO: For now, this is only advisory. We'll continue with the explanation,
      // because the user may be asking a general programming question.
      this.interactionHistory.log('No AppMaps exist in the project');
      this.interactionHistory.addEvent(
        new PromptInteractionEvent('makeAppMaps', 'system', MAKE_APPMAPS_PROMPT)
      );

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

const MODE_PREFIXES = {
  '@explain ': Mode.Explain,
  '@generate ': Mode.Generate,
};

export default function explain(
  clientRequest: ClientRequest,
  contextProvider: ContextProvider,
  projectInfoProvider: ProjectInfoProvider,
  options: ExplainOptions,
  chatHistory?: ChatHistory
): IExplain {
  let { question } = clientRequest;

  const removeModePrefix = (prefix: string) => {
    question = question.slice(prefix.length);
  };

  const inferMode = (): Mode => {
    for (const [prefix, mode] of Object.entries(MODE_PREFIXES)) {
      if (question.startsWith(prefix)) {
        removeModePrefix(prefix);
        return mode;
      }
    }
    return Mode.Explain;
  };

  const modeSelection = options.mode || inferMode();

  const interactionHistory = new InteractionHistory();
  const completionService = new OpenAICompletionService(
    interactionHistory,
    options.modelName,
    options.temperature
  );

  const modes: Record<Mode, () => IMode> = {
    [Mode.Explain]: () => new ExplainMode(interactionHistory),
    [Mode.Generate]: () => new GenerateMode(interactionHistory),
  };
  const mode = modes[modeSelection]();

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
    mode,
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
