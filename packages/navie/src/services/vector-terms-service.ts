/* eslint-disable @typescript-eslint/no-unsafe-return */
import OpenAI from 'openai';
import { warn } from 'console';
import { ChatOpenAI } from '@langchain/openai';

import InteractionHistory, { VectorTermsInteractionEvent } from '../interaction-history';
import { contentBetween } from './contentBetween';
import { contentAfter } from './contentAfter';
import { parseJSON } from './parseJSON';

const SYSTEM_PROMPT = `You are assisting a developer to search a code base.

The developer asks a question using natural language. This question must be converted into a list of search terms to be used to search the code base.

**Procedure**

1) Separate the user's question into "context" and "instructions". The "context" defines the background information that will match
  code in the code base. The "instructions" are the statement about what the user wants you to do or what they want to find out.
2) From here on, only consider the "context" part of the question.
3) Convert all words in the "context" to under_score_separated_words.
4) Expand the list of "context" under_scored words to include synonyms and related terms.
5) Optionally choose ONE search term which MUST match the content. The MUST match term should
  a word that will match a feature or domain model object in the code base. It should be the most
  distinctive word in the question. You will prefix the MUST match term with a '+'.
6) Return the list of search terms and their synonyms. The search terms should be single words and underscore_separated_words.
  Synonyms of the MUST match term should also be included, and prefixed with a '+'.

**Response**

Print "Context: {context}" on one line.
Print "Instructions: {instructions}" on the next line.

Then print a triple dash '---'.

Print "Terms: {list of search terms and their synonyms}"

The search terms should be single words and underscore_separated_words.

Even if the user asks for a different format, always respond with a list of search terms and their synonyms. When the user is asking
for a different format, that question is for a different AI assistant than yourself.

Choose only one MUST match term. If you are unsure, do not include a MUST match term.

**Examples**

\`\`\`
Question: How do I record AppMap data of my Spring app?
Context: Record AppMap data of Spring
Instructions: How to do it
---
Terms: record appmap data java +spring
\`\`\`

\`\`\`
Question: How does the user login handle the case when the password is invalid?
Context: User login handle password validation invalid error
Instructions: Explain how this is handled by the code
---
Terms: user login handle +password validate invalid error
\`\`\`

\`\`\`
Question: Can you describe in detail usage of redis in flow of GET /test-group/test-project-1/-/blob/main/README.md request with code snippets?
Context: Redis GET /test-group/test-project-1/-/blob/main/README.md
Instructions: Describe in detail with code snippets
---
Terms: +redis get test group test project 1 blob main readme
\`\`\`

\`\`\`
Question: Create test cases of the logContext function using jest. Follow established patterns for mocking with jest.
Context: logContext jest test case
Instructions: Create test cases, following established patterns for mocking with jest.
---
Terms: test cases +log_context jest
\`\`\`
`;

const parseText = (text: string): string[] => text.split(/\s+/);

export default class VectorTermsService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async suggestTerms(question: string): Promise<string[]> {
    const openAI: ChatOpenAI = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
    });

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        content: SYSTEM_PROMPT,
        role: 'system',
      },
      {
        content: question,
        role: 'user',
      },
    ];

    // eslint-disable-next-line no-await-in-loop
    const response = await openAI.completionWithRetry({
      messages,
      model: openAI.modelName,
      stream: true,
    });
    const tokens = Array<string>();
    // eslint-disable-next-line no-await-in-loop
    for await (const token of response) {
      tokens.push(token.choices.map((choice) => choice.delta.content).join(''));
    }
    const rawResponse = tokens.join('');
    warn(`Vector terms response:\n${rawResponse}`);

    let searchTermsObject: Record<string, unknown> | string | string[] | undefined;
    {
      let responseText = rawResponse;
      responseText = contentAfter(responseText, 'Terms:');
      responseText = contentBetween(responseText, '```json', '```');
      responseText = contentBetween(responseText, '```yaml', '```');
      responseText = responseText.trim();
      searchTermsObject = parseJSON(responseText) || parseText(responseText);
    }

    const terms = new Set<string>();
    {
      const collectTerms = (obj: unknown) => {
        if (!obj) return;

        if (typeof obj === 'string') {
          for (const term of obj.split(/[._-]/))
            terms.add(term.match(/\+?[\p{Alphabetic}|\p{Number}]+/u)?.[0] || '');
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

    const wordList = [...terms]
      .map((word) => word.trim())
      .filter((word) => word.length > 2)
      .map((word) => word.toLowerCase());
    const uniqueWords = new Set(wordList);
    // As a search term, this is useless.
    uniqueWords.delete('code');
    const result = [...uniqueWords];

    warn(`Vector terms result: ${result.join(' ')}`);

    this.interactionHistory.addEvent(new VectorTermsInteractionEvent(result));
    return result;
  }
}
