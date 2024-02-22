import { ChatHistory, ClientRequest, CodeExplainerService, ExplainOptions } from '../src/explain';
import CompletionService from '../src/services/completion-service';
import MemoryService from '../src/services/memory-service';
import VectorTermsService from '../src/services/vector-terms-service';
import { ContextProvider, ContextRequest, ContextResponse } from '../src/context';
import Message from '../src/message';
import InteractionHistory from '../src/interaction-history';
import LookupContextService from '../src/services/lookup-context-service';
import ApplyContextService from '../src/services/apply-context-service';

const SEQUENCE_DIAGRAMS = [`diagram-1`, `diagram-2`];
const CODE_SNIPPETS = {
  'app/user.rb': `class User < ApplicationRecord; end`,
  'app/post.rb': `class Post < ApplicationRecord; end`,
};
const CODE_OBJECTS = [
  `SELECT "users".* FROM "users" WHERE "users"."id" = $1 LIMIT 1`,
  `SELECT "posts".* FROM "posts" WHERE "posts"."user_id" = $1`,
];

const SEARCH_CONTEXT = {
  sequenceDiagrams: SEQUENCE_DIAGRAMS,
  codeSnippets: CODE_SNIPPETS,
  codeObjects: CODE_OBJECTS,
};

const TOKEN_STREAM: AsyncIterable<string> = {
  [Symbol.asyncIterator]: async function* () {
    yield 'The user management system is a system ';
    yield 'that allows users to create and manage their own accounts.';
  },
};

const EXPLAIN_OPTIONS: ExplainOptions = {
  modelName: 'gpt-3.5-turbo',
  responseTokens: 1000,
  tokenLimit: 5000,
  temperature: 0.5,
};

describe('CodeExplainerService', () => {
  let interactionHistory: InteractionHistory;
  let requestContext: (request: ContextRequest) => Promise<ContextResponse>;
  let vectorTermsService: VectorTermsService;
  let completionService: CompletionService;
  let memoryService: MemoryService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let codeExplainerService: CodeExplainerService;
  let tokenCount: number;
  const question = 'How does user management work?';
  let codeSelection: string | undefined = undefined;

  beforeEach(async () => {
    interactionHistory = new InteractionHistory();
    completionService = {
      complete: () => TOKEN_STREAM,
    };
    vectorTermsService = new VectorTermsService(interactionHistory, 'gpt-4', 0.5);
    jest.spyOn(vectorTermsService, 'suggestTerms').mockImplementation((query: string) => {
      const expectedAggregateQuestion = [question, codeSelection].filter(Boolean).join('\n\n');
      expect(query).toEqual(expectedAggregateQuestion);
      return Promise.resolve(['user', 'management']);
    });
    applyContextService = new ApplyContextService(interactionHistory);
  });

  afterEach(() => jest.restoreAllMocks());

  async function explain(
    clientRequest: ClientRequest,
    options: ExplainOptions,
    history: ChatHistory = []
  ): Promise<string[]> {
    const result = codeExplainerService.execute(clientRequest, options, history);
    const resultArray = new Array<string>();
    for await (const item of result) {
      resultArray.push(item);
    }
    return resultArray;
  }

  describe('without chat history', () => {
    beforeEach(() => {
      tokenCount = 3970;
      const lookupProvider: ContextProvider = jest
        .fn()
        .mockImplementation((request: ContextRequest) => {
          expect(request.vectorTerms).toEqual(['user', 'management']);
          expect(request.tokenCount).toEqual(tokenCount);
          return Promise.resolve(SEARCH_CONTEXT);
        });
      lookupContextService = new LookupContextService(interactionHistory, lookupProvider);
      memoryService = new MemoryService(interactionHistory, 'gpt-4', 0.5);
      jest
        .spyOn(memoryService, 'predictSummary')
        .mockRejectedValue('predictSummary should not be called for the initial question');

      codeExplainerService = new CodeExplainerService(
        interactionHistory,
        completionService,
        vectorTermsService,
        lookupContextService,
        applyContextService,
        memoryService
      );
    });

    it('produces an explanation', async () => {
      const result = await explain(
        {
          question,
        },
        EXPLAIN_OPTIONS,
        []
      );
      expect(result).toEqual([
        'The user management system is a system ',
        'that allows users to create and manage their own accounts.',
      ]);
    });

    describe('with code selection', () => {
      beforeEach(() => {
        tokenCount = 3931;
        codeSelection = `class UserController { create() { } }`;
      });

      it('includes the code selection in the prompt', async () => {
        const result = await explain(
          {
            question,
            codeSelection,
          },
          EXPLAIN_OPTIONS,
          []
        );
        expect(result).toEqual([
          'The user management system is a system ',
          'that allows users to create and manage their own accounts.',
        ]);
      });
    });
  });

  describe('with chat history', () => {
    const userMessage = {
      id: '1',
      isUser: true,
      text: 'What is user management?',
    };
    const aiMessage = {
      id: '2',
      isUser: false,
      text: 'The user management system is a system that allows users to create and manage their own accounts.',
    };

    const history: ChatHistory = [userMessage, aiMessage].map((msg) => ({
      content: msg.text,
      role: msg.isUser ? 'user' : 'system',
    }));

    beforeEach(() => {
      requestContext = jest
        .fn()
        .mockRejectedValue('requestContext should not be called for follow-up questions');

      memoryService = new MemoryService(interactionHistory, 'gpt-4', 0.5);
      memoryService.predictSummary = jest.fn().mockImplementation((messages: Message[]) => {
        expect(messages.map((msg) => msg.content)).toEqual([userMessage.text, aiMessage.text]);
        return Promise.resolve(
          'The user asked about user management. The AI responded with a description of the user management subsystem.'
        );
      });

      codeExplainerService = new CodeExplainerService(
        interactionHistory,
        completionService,
        vectorTermsService,
        lookupContextService,
        applyContextService,
        memoryService
      );
    });

    it('summarizes the chat history in the messages', async () => {
      const result = await explain({ question }, EXPLAIN_OPTIONS, history);
      expect(result).toEqual([
        'The user management system is a system ',
        'that allows users to create and manage their own accounts.',
      ]);
      expect(memoryService.predictSummary).toHaveBeenCalledWith(history);
    });

    it('does not request context from the client', async () => {
      await explain({ question }, EXPLAIN_OPTIONS, history);

      expect(requestContext).not.toHaveBeenCalled();
    });
  });
});
