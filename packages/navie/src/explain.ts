import Message from './message';
import MemoryService from './services/memory-service';
import VectorTermsService from './services/vector-terms-service';
import CompletionService, { OpenAICompletionService } from './services/completion-service';
import InteractionHistory, {
  InteractionEvent,
  InteractionHistoryEvents,
} from './interaction-history';
import { ContextProvider } from './context';
import ProjectInfoService from './services/project-info-service';
import { ProjectInfo, ProjectInfoProvider } from './project-info';
import CodeSelectionService from './services/code-selection-service';
import { AgentMode, AgentOptions } from './agent';
import AgentSelectionService from './services/agent-selection-service';
import LookupContextService from './services/lookup-context-service';
import ApplyContextService from './services/apply-context-service';

export type ChatHistory = Message[];

export interface ClientRequest {
  question: string;
  codeSelection?: string;
}

export class ExplainOptions {
  agentMode: AgentMode | undefined;
  modelName = process.env.APPMAP_NAVIE_MODEL ?? 'gpt-4-0125-preview';
  tokenLimit = Number(process.env.APPMAP_NAVIE_TOKEN_LIMIT ?? 8000);
  temperature = 0.4;
  responseTokens = 1000;
}

export class CodeExplainerService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    private readonly completionService: CompletionService,
    private readonly agentSelectionService: AgentSelectionService,
    private readonly codeSelectionService: CodeSelectionService,
    private readonly projectInfoService: ProjectInfoService,
    private readonly memoryService: MemoryService
  ) {}

  async *execute(
    clientRequest: ClientRequest,
    options: ExplainOptions,
    chatHistory?: ChatHistory
  ): AsyncIterable<string> {
    const { question: baseQuestion, codeSelection } = clientRequest;

    const projectInfoResponse = await this.projectInfoService.lookupProjectInfo();
    const projectInfo: ProjectInfo[] = Array.isArray(projectInfoResponse)
      ? projectInfoResponse
      : [projectInfoResponse];

    const { question, agent: mode } = this.agentSelectionService.selectAgent(
      baseQuestion,
      options,
      projectInfo
    );

    const tokensAvailable = (): number =>
      options.tokenLimit - options.responseTokens - this.interactionHistory.computeTokenSize();

    const aggregateQuestion = [
      ...(chatHistory || [])
        .filter((message) => message.role === 'user')
        .map((message) => message.content),
      question,
      codeSelection,
    ]
      .filter(Boolean)
      .join('\n\n');

    const agentOptions = new AgentOptions(
      question,
      aggregateQuestion,
      chatHistory?.map((message) => message.content) || [],
      projectInfo,
      codeSelection
    );
    await mode.perform(agentOptions, tokensAvailable);

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

  const codeSelectionService = new CodeSelectionService(interactionHistory);
  const vectorTermsService = new VectorTermsService(
    interactionHistory,
    options.modelName,
    options.temperature
  );
  const lookupContextService = new LookupContextService(interactionHistory, contextProvider);
  const applyContextService = new ApplyContextService(interactionHistory);

  const agentSelectionService = new AgentSelectionService(
    interactionHistory,
    vectorTermsService,
    lookupContextService,
    applyContextService
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
