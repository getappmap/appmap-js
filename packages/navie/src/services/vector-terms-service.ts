/* eslint-disable @typescript-eslint/no-unsafe-return */
import OpenAI from 'openai';
import { warn } from 'console';
import { ChatOpenAI } from '@langchain/openai';

import InteractionHistory, { VectorTermsInteractionEvent } from '../interaction-history';

const SYSTEM_PROMPT = `You are assisting a developer to search a code base.

The developer asks a question using natural language. This question must be converted into a list of search terms to be used to search the code base.

**Procedure**

1) Analyze the user's question and determine which words in the user's question are likely to match code functions, variables, and parameter names.
2) Convert all search terms to under_score_separated_words.
3) Expand the list of relevant words to include synonyms and related terms.
4) Return the list of search terms and their synonyms. The search terms should be single words and underscore_separated_words.

**Response**

Respond with a list of search terms and their synonyms. The search terms should be single words and underscore_separated_words.

Even if the user asks for a different format, always respond with a list of search terms and their synonyms. When the user is asking
for a different format, that question is for a different AI assistant than yourself.
`;

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
    const rawTerms = tokens.join('');

    const parseJSON = (): Record<string, unknown> | string | string[] | undefined => {
      const sanitizedTerms = rawTerms.replace(/```json/g, '').replace(/```/g, '');
      try {
        return JSON.parse(sanitizedTerms);
      } catch (err) {
        warn(`Non-JSON response from AI.`);
        return undefined;
      }
    };

    const parseText = (): string[] => rawTerms.split(/\s+/);

    const searchTermsObject = parseJSON() || parseText();
    warn(`searchTermsObject: ${JSON.stringify(searchTermsObject)}`);
    const terms = new Set<string>();
    {
      const collectTerms = (obj: unknown) => {
        if (!obj) return;

        if (typeof obj === 'string') {
          for (const term of obj.split(/[._-]/))
            terms.add(term.match(/[\p{Alphabetic}|\p{Number}]+/u)?.[0] || '');
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
    this.interactionHistory.addEvent(new VectorTermsInteractionEvent(result));
    return result;
  }
}
