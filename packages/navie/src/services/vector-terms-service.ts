import { warn } from 'console';

import InteractionHistory, { VectorTermsInteractionEvent } from '../interaction-history';
import contentAfter from '../lib/content-after';
import parseJSON from '../lib/parse-json';
import Message from '../message';
import CompletionService from './completion-service';

const SYSTEM_PROMPT = `You are assisting a developer to search a code base.

The developer asks a question using natural language. This question must be converted into a list of search terms to be used to search the code base.

**Procedure**

1) Separate the user's question into "context" and "instructions". The "context" defines the background information that will match
  code in the code base. The "instructions" are the statement about what the user wants you to do or what they want to find out.
2) From here on, only consider the "context" part of the question.
3) Expand the list of "context" words to include synonyms and related terms.
4) Optionally choose a small number of search terms which are MOST SELECTIVE. The MOST SELECTIVE match terms should
  be words that will match a feature or domain model object in the code base. They should be the most
  distinctive words in the question. You will prefix the MOST SELECTIVE terms with a '+'.

**Response**

Print "Context: {context}" on one line.
Print "Instructions: {instructions}" on the next line.

Then print a triple dash '---'.

Print "Terms: {list of search terms and their synonyms}"

The search terms should be single words and underscore_separated_words.

Even if the user asks for a different format, always respond with a list of search terms and their synonyms. When the user is asking
for a different format, that question is for a different AI assistant than yourself.`;

const promptExamples: Message[] = [
  {
    content: 'How do I record AppMap data of my Spring app?',
    role: 'user',
  },
  {
    content: `Context: Record AppMap data of Spring
Instructions: How to do it
---
Terms: record AppMap data Java +Spring`,
    role: 'assistant',
  },

  {
    content: 'How does the user login handle the case when the password is invalid?',
    role: 'user',
  },
  {
    content: `Context: User login handle password validation invalid error
Instructions: Explain how this is handled by the code
---
Terms: user login handle +password validate invalid error`,
    role: 'assistant',
  },

  {
    content:
      'Can you describe in detail usage of redis in flow of GET /test-group/test-project-1/-/blob/main/README.md request with code snippets?',
    role: 'user',
  },
  {
    content: `Context: Redis GET /test-group/test-project-1/-/blob/main/README.md
Instructions: Describe in detail with code snippets
---
Terms: +Redis get test-group test-project-1 blob main README`,
    role: 'assistant',
  },

  {
    content:
      'Create test cases of the logContext function using jest. Follow established patterns for mocking with jest.',
    role: 'user',
  },
  {
    content: `Context: logContext jest test case
Instructions: Create test cases, following established patterns for mocking with jest.
---
Terms: test cases +logContext jest`,
    role: 'assistant',
  },

  {
    content: 'auth',
    role: 'user',
  },
  {
    content: `Context: auth authentication authorization
Instructions: Describe the authentication and authorization process
---
Terms: +auth authentication authorization token strategy provider`,
    role: 'assistant',
  },
];

const parseText = (text: string): string[] => text.split(/\s+/);

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

    const response = this.completionsService.complete(messages, {
      model: this.completionsService.miniModelName,
    });
    const tokens = Array<string>();
    for await (const token of response) {
      tokens.push(token);
    }
    const rawResponse = tokens.join('');
    warn(`Vector terms response:\n${rawResponse}`);

    let searchTermsObject: Record<string, unknown> | string | string[] | undefined;
    {
      let responseText = rawResponse;
      responseText = contentAfter(responseText, 'Terms:');
      searchTermsObject =
        parseJSON<Record<string, unknown> | string | string[]>(responseText, false) ||
        parseText(responseText);
    }

    const terms = new Set<string>();
    {
      const collectTerms = (obj: unknown) => {
        if (!obj) return;

        if (typeof obj === 'string') {
          terms.add(obj);
        } else if (Array.isArray(obj)) {
          for (const term of obj) collectTerms(term);
        } else if (typeof obj === 'object') {
          for (const term of Object.values(obj)) {
            collectTerms(term);
          }
        }
      };
      collectTerms(searchTermsObject);
    }

    const result = [...terms];
    this.interactionHistory.addEvent(new VectorTermsInteractionEvent(result));
    return result;
  }
}
