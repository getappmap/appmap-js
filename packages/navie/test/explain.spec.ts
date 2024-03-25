import assert from 'assert';
import { Agent, AgentMode, AgentOptions } from '../src/agent';
import { ChatHistory, ClientRequest, CodeExplainerService, ExplainOptions } from '../src/explain';
import InteractionHistory from '../src/interaction-history';
import Message from '../src/message';
import AgentSelectionService from '../src/services/agent-selection-service';
import CodeSelectionService from '../src/services/code-selection-service';
import CompletionService from '../src/services/completion-service';
import MemoryService from '../src/services/memory-service';
import ProjectInfoService from '../src/services/project-info-service';
import {
  APPMAP_CONFIG,
  APPMAP_STATS,
  TOKEN_STREAM,
  doesNotPredictSummary,
  predictsSummary,
  providesProjectInfo,
} from './fixture';

describe('CodeExplainerService', () => {
  let interactionHistory: InteractionHistory;
  let completionService: CompletionService;
  let agentSelectionService: AgentSelectionService;
  let codeSelection: string | undefined;
  let codeSelectionService: CodeSelectionService;
  let memoryService: MemoryService;
  let projectInfoService: ProjectInfoService;
  let explainOptions: ExplainOptions;
  let agent: Agent;
  let codeExplainerService: CodeExplainerService;

  let userMessage1: string;
  let assistantMessage1: string | undefined;
  let userMessage2: string | undefined;

  function buildCodeExplainerService() {
    return new CodeExplainerService(
      interactionHistory,
      completionService,
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

  function buildClientRequest(): ClientRequest {
    const request: ClientRequest = { question: userMessage2 || userMessage1 };
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
    codeExplainerService: CodeExplainerService = buildCodeExplainerService(),
    clientRequest: ClientRequest = buildClientRequest(),
    options: ExplainOptions = defaultExplainOptions(),
    history: ChatHistory = chatHistory()
  ): Promise<string[]> {
    const result = codeExplainerService.execute(clientRequest, options, history);
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
      complete: () => TOKEN_STREAM,
    };
    codeSelection = undefined;
    codeSelectionService = new CodeSelectionService(interactionHistory);
    projectInfoService = {
      lookupProjectInfo: providesProjectInfo(),
    } as unknown as ProjectInfoService;
  });

  describe('initial question', () => {
    beforeEach(() => {
      memoryService = {
        predictSummary: doesNotPredictSummary(),
      } as unknown as MemoryService;
      explainOptions = defaultExplainOptions();
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
      expect(interactionHistory.events.map((event) => event.metadata)).toEqual([]);
    });

    it('returns a response', async () => {
      const tokens = await explain();
      expect(tokens).toEqual([
        'The user management system is a system ',
        'that allows users to create and manage their own accounts.',
      ]);
    });
  });

  describe('follow-up question', () => {
    beforeEach(() => {
      assistantMessage1 = 'User management works by...';
      userMessage2 = 'What about user roles?';
      memoryService = {
        predictSummary: predictsSummary(),
      } as unknown as MemoryService;
      explainOptions = defaultExplainOptions();
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
          chatHistory: [userMessage1, assistantMessage1],
          codeSelection: undefined,
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
      expect(interactionHistory.events.map((event) => event.metadata)).toEqual([]);
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
