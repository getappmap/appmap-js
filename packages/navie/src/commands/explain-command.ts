import { warn } from 'console';

import { AgentMode, AgentOptions } from '../agent';
import Gatherer from '../agents/gatherer';
import AgentSelectionService from '../services/agent-selection-service';
import ClassificationService from '../services/classification-service';
import CodeSelectionService from '../services/code-selection-service';
import CompletionService, { PromptTooLongError } from '../services/completion-service';
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
import { type UserOptions } from '../lib/parse-options';
import { ContextV2 } from '../context';
import assert from 'assert';
import { UserContext } from '../user-context';

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
    performance.mark('start');

    const { question: baseQuestion, codeSelection } = request;

    const classifyEnabled = request.userOptions.isEnabled('classify', true);
    const tokenLimit = request.userOptions.numberValue('tokenlimit') || this.options.tokenLimit;

    let contextLabelsFn: Promise<ContextV2.ContextLabel[]> | undefined;

    performance.mark('classifyStart');
    if (classifyEnabled)
      contextLabelsFn = this.classifierService
        .classifyQuestion(baseQuestion, chatHistory)
        .catch((err) => {
          warn(`Error classifying question: ${err}`);
          return [];
        });
    void contextLabelsFn?.then(() => performance.measure('classify', 'classifyStart'));

    let projectInfo: ProjectInfo[] = [];
    if (isProjectInfoEnabled(request.userOptions)) {
      const baseBranch = request.userOptions.stringValue('base');
      const diffEnabled = !!(baseBranch || request.userOptions.isEnabled('diff', false));

      const projectInfoResponse = await this.projectInfoService.lookupProjectInfo(
        diffEnabled,
        baseBranch
      );
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
    const { agentMode, question, agent: mode } = agentSelectionResult;

    if (agentSelectionResult.selectionMessage) {
      yield agentSelectionResult.selectionMessage;
      yield '\n\n';
    }

    const tokensAvailable = (): number =>
      tokenLimit - this.options.responseTokens - this.interactionHistory.computeTokenSize();

    const aggregateQuestion = [
      ...(chatHistory || [])
        .filter((message) => message.role === 'user')
        .map((message) => message.content),
      question,
    ];
    if (codeSelection) {
      const rendered =
        typeof codeSelection !== 'string'
          ? UserContext.renderItems(codeSelection, { interactionHistory: this.interactionHistory })
          : codeSelection;
      aggregateQuestion.push(rendered);
    }

    const agentOptions = new AgentOptions(
      question,
      aggregateQuestion.filter(Boolean).join('\n\n'),
      request.userOptions,
      chatHistory || [],
      projectInfo,
      codeSelection,
      contextLabels
    );

    const isArchitecture = contextLabels
      ?.filter((label) => label.weight === ContextV2.ContextLabelWeight.High)
      .some(
        (label) =>
          label.name === ContextV2.ContextLabelName.Architecture ||
          label.name === ContextV2.ContextLabelName.Overview
      );

    if (projectInfo) this.projectInfoService.promptProjectInfo(isArchitecture, projectInfo);

    performance.mark('agentStart');
    const agentResponse = await mode.perform(agentOptions, tokensAvailable);
    if (agentResponse) {
      yield agentResponse.response;
      if (agentResponse.abort) return;
    }
    performance.measure('agent preparation', 'agentStart');

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

    if (isGathererEnabled(request.userOptions, agentMode, contextLabels)) {
      performance.mark('gathererStart');
      yield* this.gatherAdditionalInformation();
      performance.measure('gatherer', 'gathererStart');
    }

    const { messages } = this.interactionHistory.buildState();

    this.interactionHistory.addEvent(
      new CompletionEvent(
        this.completionService.modelName,
        mode.temperature ?? this.completionService.temperature ?? -1
      )
    );

    performance.mark('completionStart');
    console.log('completion start');
    const response = this.completionService.complete(messages, { temperature: mode.temperature });
    if (mode.filter) yield* mode.filter(response);
    else yield* response;
    console.log('completion end');
    performance.measure('completion', 'completionStart');

    performance.measure('total', 'start');
  }

  private async *gatherAdditionalInformation(maxSteps = 10) {
    let steps = 0;
    try {
      const gatherer = new Gatherer(
        this.interactionHistory.events,
        this.interactionHistory,
        this.completionService,
        this.agentSelectionService.contextService,
        this.projectInfoService
      );
      for (steps = 0; steps < maxSteps && !(await gatherer.step()); steps++)
        yield steps > 0 ? '.' : 'Gathering additional information, please wait...';
    } catch (err) {
      if (steps > 0 && err instanceof PromptTooLongError) {
        yield ` reached the model context limit (${err.maxTokens} tokens).\n\n`;
        return;
      }
      console.warn('Error while gathering: ', err);
    }
    if (steps > 0) yield ' done!\n\n';
  }
}

function isProjectInfoEnabled(userOptions: UserOptions): boolean {
  const isDiffRequested = userOptions.isEnabled('diff', false);
  return isDiffRequested || userOptions.isEnabled('projectinfo', true);
}

function isGathererEnabled(
  userOptions: UserOptions,
  agentMode: AgentMode,
  contextLabels: ContextV2.ContextLabel[]
): boolean {
  const enabledByDefault =
    [AgentMode.Generate, AgentMode.Test].includes(agentMode) ||
    !!contextLabels.find((l) => l.name === ContextV2.ContextLabelName.Overview);

  return userOptions.isEnabled('gather', enabledByDefault);
}
