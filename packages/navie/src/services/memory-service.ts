import { ConversationSummaryMemory } from 'langchain/memory';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

import buildChatOpenAI from '../chat-openai';
import Message from '../message';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';

export default class MemoryService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly modelName: string,
    public readonly temperature: number
  ) {}

  async predictSummary(messages: Message[]) {
    const predictAI = buildChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
    });

    const memory = new ConversationSummaryMemory({
      memoryKey: 'chat_history',
      llm: predictAI,
    });

    // eslint-disable-next-line arrow-body-style
    const lcMessages = messages.map((message) => {
      return message.role === 'user'
        ? new HumanMessage({ content: message.content })
        : new AIMessage({ content: message.content });
    });

    // TODO: We never have an existing summary, so the second argument is always empty.
    const summary = await memory.predictNewSummary(lcMessages, '');
    this.interactionHistory.addEvent(new PromptInteractionEvent('summary', false, summary));
  }
}
