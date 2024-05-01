import { warn } from 'console';

import Message from './message';
import MemoryService from './services/memory-service';
import VectorTermsService from './services/vector-terms-service';
import CompletionService, { OpenAICompletionService } from './services/completion-service';
import InteractionHistory, {
  InteractionEvent,
  InteractionHistoryEvents,
} from './interaction-history';
import { ContextV2 } from './context';
import ProjectInfoService from './services/project-info-service';
import { ProjectInfoProvider } from './project-info';
import CodeSelectionService from './services/code-selection-service';
import { AgentMode, AgentOptions } from './agent';
import { HelpProvider } from './help';
import LookupContextService from './services/lookup-context-service';
import ApplyContextService from './services/apply-context-service';
import ClassificationService from './services/classification-service';
import AgentSelectionService from './services/agent-selection-service';
import { CommandOptions, applyCommandOptions, parseOptions } from './command-option';
import FileChangeExtractorService from './services/file-change-extractor-service';
import FileUpdateService from './services/file-update-service';

export const DEFAULT_TOKEN_LIMIT = 12000;

export type ChatHistory = Message[];

export interface ClientRequest {
  question: string;
  codeSelection?: string;
}

export class ExplainOptions {
  agentMode: AgentMode | undefined;
  modelName = process.env.APPMAP_NAVIE_MODEL ?? 'gpt-4-turbo-2024-04-09';
  tokenLimit = Number(process.env.APPMAP_NAVIE_TOKEN_LIMIT ?? DEFAULT_TOKEN_LIMIT);
  temperature = 0.4;
  responseTokens = 1000;
  fetchProjectInfo = true;
  fetchContext = true;
}

export class CodeExplainerService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    private readonly completionService: CompletionService,
    private readonly classifierService: ClassificationService,
    private readonly agentSelectionService: AgentSelectionService,
    private readonly codeSelectionService: CodeSelectionService,
    private readonly projectInfoService: ProjectInfoService,
    private readonly memoryService: MemoryService
  ) {}

  async *execute(
    clientRequest: ClientRequest,
    requestOptions: ExplainOptions,
    chatHistory?: ChatHistory
  ): AsyncIterable<string> {
    const { codeSelection } = clientRequest;

    let commandOptions: CommandOptions;
    let question: string;
    let agentMode: AgentMode | undefined;
    {
      const parsedOptions = parseOptions(clientRequest.question);
      agentMode = parsedOptions.agentMode;
      question = parsedOptions.question;
      commandOptions = parsedOptions.options;
      applyCommandOptions(parsedOptions.options, requestOptions);
    }

    const contextLabelsFn = this.classifierService.classifyQuestion(question);

    const projectInfoResponse = await this.projectInfoService.lookupProjectInfo();
    const projectInfo = Array.isArray(projectInfoResponse)
      ? projectInfoResponse
      : [projectInfoResponse];

    const mode = this.agentSelectionService.buildAgent(agentMode);

    const tokensAvailable = (): number =>
      requestOptions.tokenLimit -
      requestOptions.responseTokens -
      this.interactionHistory.computeTokenSize();

    const aggregateQuestion = [
      ...(chatHistory || [])
        .filter((message) => message.role === 'user')
        .map((message) => message.content),
      question,
      codeSelection,
    ]
      .filter(Boolean)
      .join('\n\n');

    const contextLabels = await contextLabelsFn;
    warn(
      `Classification: ${contextLabels
        .map((label) => [label.name, label.weight].join('='))
        .join(', ')}`
    );

    const agentOptions = new AgentOptions(
      question,
      aggregateQuestion,
      chatHistory?.map((message) => message.content) || [],
      projectInfo,
      codeSelection,
      contextLabels,
      commandOptions
    );

    const isArchitecture = contextLabels
      .filter((label) => label.weight === 'high')
      .some((label) => label.name === 'architecture' || label.name === 'overview');

    if (projectInfo) this.projectInfoService.promptProjectInfo(isArchitecture, projectInfo);

    const message = await mode.perform(agentOptions, tokensAvailable);
    if (message) {
      yield message;
    }

    if (codeSelection) this.codeSelectionService.addSystemPrompt();

    const hasChatHistory = chatHistory && chatHistory.length > 0;
    if (hasChatHistory) {
      await this.memoryService.predictSummary(chatHistory);
    }

    if (codeSelection) this.codeSelectionService.applyCodeSelection(codeSelection);
    mode.applyQuestionPrompt(question);

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
  contextProvider: ContextV2.ContextProvider,
  projectInfoProvider: ProjectInfoProvider,
  helpProvider: HelpProvider,
  options: ExplainOptions,
  chatHistory?: ChatHistory
): IExplain {
  const interactionHistory = new InteractionHistory();
  const completionService = new OpenAICompletionService(
    interactionHistory,
    options.modelName,
    options.temperature
  );

  const classificationService = new ClassificationService(
    interactionHistory,
    options.modelName,
    options.temperature
  );

  const codeSelectionService = new CodeSelectionService(interactionHistory);
  const vectorTermsService = new VectorTermsService(
    interactionHistory,
    options.modelName,
    options.temperature
  );
  const fileChangeExtractorService = new FileChangeExtractorService(
    interactionHistory,
    options.modelName,
    options.temperature
  );
  const fileUpdateService = new FileUpdateService(
    interactionHistory,
    options.modelName,
    options.temperature
  );

  const contextProviderV2 = async (
    request: ContextV2.ContextRequest
  ): Promise<ContextV2.ContextResponse> =>
    contextProvider({ ...request, version: 2, type: 'search' });

  const lookupContextService = new LookupContextService(
    interactionHistory,
    contextProviderV2,
    helpProvider
  );
  const applyContextService = new ApplyContextService(interactionHistory);

  const agentSelectionService = new AgentSelectionService(
    interactionHistory,
    helpProvider,
    vectorTermsService,
    lookupContextService,
    applyContextService,
    fileChangeExtractorService,
    fileUpdateService
  );
  const projectInfoService = new ProjectInfoService(interactionHistory, projectInfoProvider);
  const memoryService = new MemoryService(
    interactionHistory,
    options.modelName,
    options.temperature
  );

  const codeExplainerService = new CodeExplainerService(
    interactionHistory,
    completionService,
    classificationService,
    agentSelectionService,
    codeSelectionService,
    projectInfoService,
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
