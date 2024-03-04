import OpenAI from 'openai';
import { warn } from 'console';
import { ChatOpenAI } from '@langchain/openai';

import buildChatOpenAI from '../chat-openai';
import InteractionHistory, { VectorTermsInteractionEvent } from '../interaction-history';

const SYSTEM_PROMPT = `**Task: Generating search terms**.

**About you**

Your job is to generate search terms from a user's question, so that a keyword search can be performed on the codebase
to return relevant code, routes, queries, and other code artifacts.

You are created and maintained by AppMap Inc, and are available to AppMap users as a service.

**About the user**

The user is a software developer who is trying to understand, maintain and enhance a codebase.

**Your method**

1) Analyze the user's question and determine which words in the user's question are likely to match code functions, variables, and parameter names.
2) Discard terms that seem to have to do with the user's question, but are not likely to match code functions, variables, and parameter names.
  Some of the words in a user's question refer to features of the code base, and some words have to do with the type of analysis that the user
  would like to do on the code. Focus on the former and discard the latter.
3) Convert all search terms to under_score_separated_words.
4) Expand the list of relevant words to include synonyms and related terms.
5) Return the list of search terms and their synonyms. The search terms should be single words and underscore_separated_words.

**Your response**

Respond with a JSON list.
`;

export default class VectorTermsService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async suggestTerms(question: string): Promise<string[]> {
    const openAI: ChatOpenAI = buildChatOpenAI({
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

    let searchTermsObject: any;
    let attemptNumber = 3;
    // eslint-disable-next-line no-plusplus
    while (!searchTermsObject && attemptNumber-- > 0) {
      // eslint-disable-next-line no-await-in-loop
      const response = await openAI.completionWithRetry({
        messages,
        model: 'gpt-4-0125-preview',
        stream: true,
      });
      const tokens = Array<string>();
      // eslint-disable-next-line no-await-in-loop
      for await (const token of response) {
        tokens.push(token.choices.map((choice) => choice.delta.content).join(''));
      }
      const rawTerms = tokens.join('');

      const sanitizedTerms = rawTerms.replace(/```json/g, '').replace(/```/g, '');
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        searchTermsObject = JSON.parse(sanitizedTerms);
      } catch (err) {
        // Retry on JSON parse error
        warn(sanitizedTerms);
        warn(`Non-JSON response from AI; will retry...`);
      }
    }

    warn(`searchTermsObject: ${JSON.stringify(searchTermsObject)}`);

    const terms = new Set<string>();
    if (
      !searchTermsObject ||
      JSON.stringify(searchTermsObject) === '[]' ||
      JSON.stringify(searchTermsObject) === '{}'
    ) {
      warn(`Unable to obtain search terms from AI. Will use the raw user search.`);
      const words = question.split(/\s/);
      for (const word of words) terms.add(word);
    } else {
      const collectTerms = (obj: any) => {
        if (typeof obj === 'string') {
          for (const term of obj.split(/[._-]/)) terms.add(term);
        } else if (Array.isArray(obj)) {
          for (const term of obj) collectTerms(term);
        } else if (typeof obj === 'object') {
          // eslint-disable-next-line guard-for-in
          for (const key in obj) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            collectTerms(obj[key]);
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
