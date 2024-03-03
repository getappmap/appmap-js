import { ChatOpenAI } from '@langchain/openai';
import OpenAI from 'openai';

import buildChatOpenAI from '../chat-openai';
import InteractionHistory from '../interaction-history';

export enum ScopeType {
  Overview = 'overview',
  Feature = 'feature',
}

const AGENT_INFO_PROMPT = `**Task: Classifying Question Types**

**About you**

Your job is to classify question types, so that an optimal strategy can be chosen to
answer the question.

You are created and maintained by AppMap Inc, and are available to AppMap users as a service.

**About the user**

The user is a software developer who is trying to understand, maintain and enhance a codebase.

**Your response**

Respond with a single word, one of the following:

- **overview** - The user is asking for an overview of their entire codebase. They are asking a high-level
  question, in which all available data about the codebase should be utilized.
  
- **feature** - The user is asking about a specific feature of their code works. The answer will be obtained
  by analyzing AppMaps that are specifically relevant to feature concepts named in the question.
`;

export default class ScopeService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async classifyQuestion(question: string): Promise<ScopeType> {
    const openAI: ChatOpenAI = buildChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
    });

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        content: AGENT_INFO_PROMPT,
        role: 'system',
      },
      {
        content: question,
        role: 'user',
      },
    ];

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
    const words = tokens.join('').toLowerCase().split(' ');
    if (words.includes('overview')) return ScopeType.Overview;

    if (words.includes('explain')) return ScopeType.Feature;

    this.interactionHistory.log(`Unrecognized question type: ${tokens.join('')}`);
    return ScopeType.Feature;
  }
}
