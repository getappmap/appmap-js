import { warn } from 'console';

import { AgentOptions } from '../agent';
import AgentSelectionService from '../services/agent-selection-service';
import ClassificationService from '../services/classification-service';
import CodeSelectionService from '../services/code-selection-service';
import CompletionService from '../services/completion-service';
import MemoryService from '../services/memory-service';
import ProjectInfoService from '../services/project-info-service';
import InteractionHistory from '../interaction-history';
import { ProjectInfo } from '../project-info';
import Command from '../command';
import { ChatHistory, ClientRequest } from '../navie';

export type ExplainOptions = {
  tokenLimit: number;
  responseTokens: number;
};

export default class ExplainCommand implements Command {
  constructor(
    private readonly options: ExplainOptions,
    public readonly interactionHistory: InteractionHistory,
    private readonly completionService: CompletionService,
    private readonly classifierService: ClassificationService,
    private readonly agentSelectionService: AgentSelectionService,
    private readonly codeSelectionService: CodeSelectionService,
    private readonly projectInfoService: ProjectInfoService,
    private readonly memoryService: MemoryService
  ) {}

  async *execute(clientRequest: ClientRequest, chatHistory?: ChatHistory): AsyncIterable<string> {
    const { question: baseQuestion, codeSelection } = clientRequest;

    const contextLabelsFn = this.classifierService.classifyQuestion(baseQuestion, chatHistory);

    const projectInfoResponse = await this.projectInfoService.lookupProjectInfo();
    const projectInfo: ProjectInfo[] = Array.isArray(projectInfoResponse)
      ? projectInfoResponse
      : [projectInfoResponse];

    const contextLabels = await contextLabelsFn;
    warn(
      `Classification: ${contextLabels
        .map((label) => [label.name, label.weight].join('='))
        .join(', ')}`
    );

    const { question, agent: mode } = this.agentSelectionService.selectAgent(
      baseQuestion,
      contextLabels
    );

    const tokensAvailable = (): number =>
      this.options.tokenLimit -
      this.options.responseTokens -
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

    const agentOptions = new AgentOptions(
      question,
      aggregateQuestion,
      chatHistory?.map((message) => message.content) || [],
      projectInfo,
      codeSelection,
      contextLabels
    );

    const isArchitecture = contextLabels
      ?.filter((label) => label.weight === 'high')
      .some((label) => label.name === 'architecture' || label.name === 'overview');

    this.projectInfoService.promptProjectInfo(isArchitecture, projectInfo);
    const agentResponse = await mode.perform(agentOptions, tokensAvailable);
    if (agentResponse) {
      yield agentResponse.response;
      if (agentResponse.abort) return;
    }

    if (codeSelection) this.codeSelectionService.addSystemPrompt();

    const hasChatHistory = chatHistory && chatHistory.length > 0;
    if (hasChatHistory) {
      await this.memoryService.predictSummary(chatHistory);
    }

    if (codeSelection) this.codeSelectionService.applyCodeSelection(codeSelection);
    mode.applyQuestionPrompt(question);

    const response = this.completionService.complete({ temperature: mode.temperature });
    for await (const token of response) {
      yield token;
    }
  }
}
