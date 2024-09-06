import { warn } from 'console';

import { AgentOptions } from '../agent';
import AgentSelectionService from '../services/agent-selection-service';
import ClassificationService from '../services/classification-service';
import CodeSelectionService from '../services/code-selection-service';
import CompletionService from '../services/completion-service';
import MemoryService from '../services/memory-service';
import ProjectInfoService from '../services/project-info-service';
import InteractionHistory, {
  CompletionEvent,
  PromptInteractionEvent,
} from '../interaction-history';
import { ProjectInfo } from '../project-info';
import Command, { CommandRequest } from '../command';
import { ChatHistory } from '../navie';
import getMostRecentMessages from '../lib/get-most-recent-messages';
import Filter from '../lib/filter';
import { ContextV2 } from '../context';
import assert from 'assert';

const COLOR_GREEN = '\x1b[32m';
const COLOR_RESET = '\x1b[0m';

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

  async *execute(request: CommandRequest, chatHistory?: ChatHistory): AsyncIterable<string> {
    const { question: baseQuestion, codeSelection } = request;

    const classifyEnabled = request.userOptions.isEnabled('classify', true);

    let contextLabelsFn: Promise<ContextV2.ContextLabel[]> | undefined;

    if (classifyEnabled)
      contextLabelsFn = this.classifierService.classifyQuestion(baseQuestion, chatHistory);

    let projectInfo: ProjectInfo[] = [];
    if (request.userOptions.isEnabled('projectinfo', true)) {
      const projectInfoResponse = await this.projectInfoService.lookupProjectInfo();
      projectInfo = Array.isArray(projectInfoResponse)
        ? projectInfoResponse
        : [projectInfoResponse];
    }

    let contextLabels: ContextV2.ContextLabel[] | undefined;
    if (classifyEnabled) {
      assert(contextLabelsFn);
      contextLabels = await contextLabelsFn;
      warn(`${COLOR_GREEN}Question: ${baseQuestion}${COLOR_RESET}`);
      warn(
        `${COLOR_GREEN}Classification: ${contextLabels
          .map((label) => [label.name, label.weight].join('='))
          .join(', ')}${COLOR_RESET}`
      );
    } else {
      contextLabels = [];
    }

    const agentSelectionResult = this.agentSelectionService.selectAgent(
      baseQuestion,
      contextLabels,
      request.userOptions
    );
    const { question, agent: mode } = agentSelectionResult;

    if (agentSelectionResult.selectionMessage) {
      yield agentSelectionResult.selectionMessage;
      yield '\n\n';
    }

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
      request.userOptions,
      chatHistory || [],
      projectInfo,
      codeSelection,
      contextLabels
    );

    const isArchitecture = contextLabels
      ?.filter((label) => label.weight === 'high')
      .some((label) => label.name === 'architecture' || label.name === 'overview');

    if (request.userOptions.isEnabled('projectinfo', true)) {
      this.projectInfoService.promptProjectInfo(isArchitecture, projectInfo);
    }

    const agentResponse = await mode.perform(agentOptions, tokensAvailable);
    if (agentResponse) {
      yield agentResponse.response;
      if (agentResponse.abort) return;
    }

    if (codeSelection) this.codeSelectionService.addSystemPrompt();

    const hasChatHistory = chatHistory && chatHistory.length > 0;
    if (hasChatHistory) {
      for (const e of await this.memoryService.predictSummary(chatHistory))
        this.interactionHistory.addEvent(e);

      for (const e of getMostRecentMessages(
        chatHistory,
        request.userOptions.numberValue('history')
      )) {
        this.interactionHistory.addEvent(e);
      }
    }

    if (request.prompt) {
      this.interactionHistory.addEvent(
        new PromptInteractionEvent('customPrompt', 'system', request.prompt)
      );
    }

    if (codeSelection) this.codeSelectionService.applyCodeSelection(codeSelection);
    mode.applyQuestionPrompt(question);

    const { messages } = this.interactionHistory.buildState();

    this.interactionHistory.addEvent(
      new CompletionEvent(
        this.completionService.modelName,
        mode.temperature ?? this.completionService.temperature ?? -1
      )
    );

    const filter: Filter = mode.newFilter();

    const response = this.completionService.complete(messages, { temperature: mode.temperature });
    for await (const token of response) {
      for await (const chunk of filter.transform(token)) yield chunk.content;
    }
    for await (const chunk of filter.end()) yield chunk.content;
  }
}
