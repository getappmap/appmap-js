/* eslint-disable @typescript-eslint/unbound-method */
import assert from 'assert';
import { Agent, AgentMode } from '../../src/agent';
import ExplainCommand, { ExplainOptions } from '../../src/commands/explain-command';
import InteractionHistory from '../../src/interaction-history';
import Message from '../../src/message';
import { ChatHistory } from '../../src/navie';
import AgentSelectionService from '../../src/services/agent-selection-service';
import CodeSelectionService from '../../src/services/code-selection-service';
import CompletionService from '../../src/services/completion-service';
import MemoryService from '../../src/services/memory-service';
import ProjectInfoService from '../../src/services/project-info-service';
import ClassificationService from '../../src/services/classification-service';

import {
  APPMAP_CONFIG,
  APPMAP_STATS,
  TOKEN_STREAM,
  doesNotPredictSummary,
  predictsSummary,
  providesProjectInfo,
} from '../fixture';
import { CommandRequest } from '../../src/command';
import { UserOptions } from '../../src/lib/parse-options';

const CompletionEvent = { type: 'completion', model: 'mock', temperature: 0.5 };
describe('ExplainCommand', () => {
  let interactionHistory: InteractionHistory;
  let completionService: CompletionService;
  let classificationService: ClassificationService;
  let agentSelectionService: AgentSelectionService;
  let codeSelection: string | undefined;
  let codeSelectionService: CodeSelectionService;
  let memoryService: MemoryService;
  let projectInfoService: ProjectInfoService;
  let agent: Agent;

  let userMessage1: string;
  let assistantMessage1: string | undefined;
  let userMessage2: string | undefined;

  function buildExplainCommand(options: ExplainOptions) {
    return new ExplainCommand(
      options,
      interactionHistory,
      completionService,
      classificationService,
      agentSelectionService,
      codeSelectionService,
      projectInfoService,
      memoryService
    );
  }

  function defaultExplainOptions() {
    return {
      agentMode: AgentMode.Explain,
      modelName: 'gpt-3.5-turbo',
      responseTokens: 1000,
      tokenLimit: 5000,
      temperature: 0.5,
    };
  }

  function chatHistory(): ChatHistory {
    const history: Message[] = [];
    // ChatHistory is the previous conversation history.
    if (userMessage2) {
      assert(userMessage1);
      assert(assistantMessage1);
      history.push({ content: userMessage1, role: 'user' });
      history.push({ content: assistantMessage1, role: 'assistant' });
    }
    return history;
  }

  function buildCommandRequest(): CommandRequest {
    const request: CommandRequest = {
      question: userMessage2 || userMessage1,
      userOptions: new UserOptions(new Map()),
    };
    if (codeSelection) request.codeSelection = codeSelection;
    return request;
  }

  function mockAgent(): Agent {
    return {
      perform: jest.fn().mockResolvedValue(undefined),
      applyQuestionPrompt: jest.fn(),
    } as unknown as Agent;
  }

  function mockAgentSelectionService(agent: Agent, question = userMessage2 || userMessage1) {
    agentSelectionService = {
      selectAgent: jest.fn().mockReturnValue({
        agent,
        question,
      }),
    } as unknown as AgentSelectionService;
  }

  async function explain(
    explainCommand: ExplainCommand = buildExplainCommand(defaultExplainOptions()),
    request: CommandRequest = buildCommandRequest(),
    history: ChatHistory = chatHistory()
  ): Promise<string[]> {
    const result = explainCommand.execute(request, history);
    const resultArray = new Array<string>();
    for await (const item of result) {
      resultArray.push(item);
    }
    return resultArray;
  }

  beforeEach(() => {
    userMessage1 = 'How does user management work?';
    interactionHistory = new InteractionHistory();
    completionService = {
      complete: jest.fn().mockReturnValue(TOKEN_STREAM),
      json: jest.fn().mockResolvedValue(undefined),
      modelName: 'mock',
      miniModelName: 'mock-mini',
      temperature: 0.5,
    } as unknown as CompletionService;
    classificationService = {
      classifyQuestion: jest.fn().mockResolvedValue([]),
    } as unknown as ClassificationService;
    codeSelection = undefined;
    codeSelectionService = new CodeSelectionService(interactionHistory);
    projectInfoService = {
      lookupProjectInfo: providesProjectInfo(),
      promptProjectInfo: jest.fn(),
    } as unknown as ProjectInfoService;
  });

  describe('initial question', () => {
    beforeEach(() => {
      memoryService = {
        predictSummary: doesNotPredictSummary(),
      } as unknown as MemoryService;
      agent = mockAgent();
      mockAgentSelectionService(agent);
    });

    it('does not apply converation summary', async () => {
      await explain();
      expect(memoryService.predictSummary).not.toHaveBeenCalled();
    });

    it('invokes the agent', async () => {
      await explain();
      expect(agent.perform).toHaveBeenCalledWith(
        {
          aggregateQuestion: userMessage1,
          chatHistory: [],
          codeSelection: undefined,
          userOptions: new UserOptions(new Map()),
          contextLabels: [],
          projectInfo: [
            {
              appmapConfig: APPMAP_CONFIG,
              appmapStats: APPMAP_STATS,
            },
          ],
          question: userMessage1,
        },
        expect.any(Function)
      );
    });

    it('applies the expected prompts', async () => {
      await explain();
      expect(interactionHistory.events.map((event) => event.metadata)).toEqual([CompletionEvent]);
    });

    it('applies the default temperature', async () => {
      await explain();
      expect(completionService.complete).toHaveBeenCalledWith([], { temperature: undefined });
    });

    describe('when the agent specifies 0 temperature', () => {
      it('applies the agent temperature', async () => {
        agent.temperature = 0;

        await explain();
        expect(completionService.complete).toHaveBeenCalledWith([], { temperature: 0 });
      });
    });

    it('returns a response', async () => {
      const tokens = await explain();
      expect(tokens).toEqual([
        'The user management system is a system ',
        'that allows users to create and manage their own accounts.',
      ]);
    });

    it('can be aborted by the agent', async () => {
      agent.perform = jest.fn().mockResolvedValue({ abort: true, response: 'abort' });
      const tokens = await explain();
      expect(tokens).toEqual(['abort']);
      expect(completionService.complete).not.toHaveBeenCalled();
    });
  });

  describe('follow-up question', () => {
    beforeEach(() => {
      assistantMessage1 = 'User management works by...';
      userMessage2 = 'What about user roles?';
      memoryService = {
        predictSummary: predictsSummary(),
      } as unknown as MemoryService;
      agent = mockAgent();
      mockAgentSelectionService(agent);
    });

    it('applies conversation summary', async () => {
      await explain();
      expect(memoryService.predictSummary).toHaveBeenCalledWith(chatHistory());
    });

    it('invokes the agent', async () => {
      await explain();
      expect(agent.perform).toHaveBeenCalledWith(
        {
          aggregateQuestion: [userMessage1, userMessage2].join('\n\n'),
          chatHistory: [
            {
              content: userMessage1,
              role: 'user',
            },
            {
              content: assistantMessage1,
              role: 'assistant',
            },
          ],
          codeSelection: undefined,
          userOptions: new UserOptions(new Map()),
          contextLabels: [],
          projectInfo: [
            {
              appmapConfig: APPMAP_CONFIG,
              appmapStats: APPMAP_STATS,
            },
          ],
          question: userMessage2,
        },
        expect.any(Function)
      );
    });

    it('applies the expected prompts', async () => {
      await explain();
      expect(interactionHistory.events.map((event) => event.metadata)).toEqual([
        {
          name: 'historicalMessage',
          role: 'user',
          type: 'prompt',
        },
        {
          name: 'historicalMessage',
          role: 'assistant',
          type: 'prompt',
        },
        CompletionEvent,
      ]);
    });

    it('returns a response', async () => {
      const tokens = await explain();
      expect(tokens).toEqual([
        'The user management system is a system ',
        'that allows users to create and manage their own accounts.',
      ]);
    });
  });
});
