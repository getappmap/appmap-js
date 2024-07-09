import { ConversationSummaryMemory } from 'langchain/memory';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

import { ContextItemEvent, InteractionEvent, PromptInteractionEvent } from '../interaction-history';
import Message from '../message';
import { PromptType, buildPromptDescriptor } from '../prompt';

export default interface MemoryService {
  predictSummary(messages: Message[]): Promise<InteractionEvent[]>;
}

export class OpenAIMemoryService implements MemoryService {
  constructor(public readonly modelName: string, public readonly temperature: number) {}

  async predictSummary(messages: Message[]) {
    const predictAI = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
    });

    const memory = new ConversationSummaryMemory({
      memoryKey: 'chat_history',
      llm: predictAI,
    });

    const lcMessages = messages.map((message) =>
      message.role === 'user'
        ? new HumanMessage({ content: message.content })
        : new AIMessage({ content: message.content })
    );

    const summary = await memory.predictNewSummary(lcMessages, '');
    return [
      new PromptInteractionEvent(
        PromptType.AppMapStats,
        'system',
        buildPromptDescriptor(PromptType.ConversationSummary)
      ),
      new ContextItemEvent(PromptType.ConversationSummary, summary),
    ];
  }
}
