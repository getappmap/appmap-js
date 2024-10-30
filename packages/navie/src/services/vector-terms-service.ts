import { warn } from 'node:console';
import { debug as makeDebug } from 'node:util';

import z from 'zod';

import InteractionHistory, { VectorTermsInteractionEvent } from '../interaction-history';
import Message from '../message';
import CompletionService from './completion-service';

const debug = makeDebug('navie:vector-terms');

const SYSTEM_PROMPT = `You are assisting a developer to search a code base.

The developer asks a question using natural language. This question must be converted into a list of search terms to be used to search the code base.

**Procedure**

1) Separate the user's question into "context" and "instructions". The "context" defines the background information that will match
  code in the code base. The "instructions" are the statement about what the user wants you to do or what they want to find out.
  Be brief in the "instructions" part.
2) From here on, only consider the "context" part of the question.
3) Expand the list of "context" words to include synonyms and related terms.
4) Optionally choose a small number of search terms which are MOST SELECTIVE. The MOST SELECTIVE match terms should
  be words that will match a feature or domain model object in the code base. They should be the most
  distinctive words in the question. You will prefix the MOST SELECTIVE terms with a '+'.
5) In order for keywords to match optimally, compound words MUST additionally be segmented into individual search terms. This is additionally very important for compound words containing acronyms.
  E.g., "httpserver" would become "http", "server", "httpserver". "xmlserializer" -> "xml", "serializer", "xmlserializer". "jsonserializer" -> "json", "serializer", "jsonserializer". etc.

  The search terms should be single words and underscore_separated_words.`;

const promptExamples: Message[] = [
  {
    content: 'How do I record AppMap data of my Spring app?',
    role: 'user',
  },
  {
    content: JSON.stringify({
      context: 'Record AppMap data of Spring',
      instructions: 'How to do it',
      terms: ['record', 'AppMap', 'data', 'Java', '+Spring'],
    }),
    role: 'assistant',
  },

  {
    content: 'How does the user login handle the case when the password is invalid?',
    role: 'user',
  },
  {
    content: JSON.stringify({
      context: 'User login handle password validation invalid error',
      instructions: 'Explain how this is handled by the code',
      terms: ['user', 'login', 'handle', '+password', 'validate', 'invalid', 'error'],
    }),
    role: 'assistant',
  },

  {
    content:
      'Can you describe in detail usage of redis in flow of GET /test-group/test-project-1/-/blob/main/README.md request with code snippets?',
    role: 'user',
  },
  {
    content: JSON.stringify({
      context: 'Redis GET /test-group/test-project-1/-/blob/main/README.md',
      instructions: 'Describe in detail with code snippets',
      terms: ['+Redis', 'get', 'test-group', 'test-project-1', 'blob', 'main', 'README'],
    }),
    role: 'assistant',
  },

  {
    content:
      'Create test cases of the logContext function using jest. Follow established patterns for mocking with jest.',
    role: 'user',
  },
  {
    content: JSON.stringify({
      context: 'logContext jest test case',
      instructions: 'Create test cases, following established patterns for mocking with jest.',
      terms: ['test', 'cases', '+logContext', 'log', 'context', 'jest'],
    }),
    role: 'assistant',
  },

  {
    content: 'auth',
    role: 'user',
  },
  {
    content: JSON.stringify({
      context: 'auth authentication authorization',
      instructions: 'Describe the authentication and authorization process',
      terms: ['+auth', 'authentication', 'authorization', 'token', 'strategy', 'provider'],
    }),
    role: 'assistant',
  },
];

const schema = z.object({
  context: z.string(),
  instructions: z.string(),
  terms: z.array(z.string()),
});

export default class VectorTermsService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly completionsService: CompletionService
  ) {}

  async suggestTerms(question: string): Promise<string[]> {
    const messages: Message[] = [
      {
        content: SYSTEM_PROMPT,
        role: 'system',
      },
      ...promptExamples,
      {
        content: question,
        role: 'user',
      },
    ];

    const response = await this.completionsService.json(messages, schema, {
      model: this.completionsService.miniModelName,
    });

    debug(`Vector terms response: ${JSON.stringify(response, undefined, 2)}`);

    const terms = response?.terms ?? [];
    if (terms.length === 0) warn('No terms suggested');
    this.interactionHistory.addEvent(new VectorTermsInteractionEvent(terms));
    return terms;
  }
}
