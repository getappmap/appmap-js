import { ConversationSummaryMemory } from 'langchain/memory';
import { BaseLanguageModelInterface } from '@langchain/core/language_models/base';

import {
  ContextItemEvent,
  ContextItemRequestor,
  InteractionEvent,
  PromptInteractionEvent,
} from '../interaction-history';
import Message from '../message';
import { PromptType, buildPromptDescriptor } from '../prompt';
import { convertToMessage } from './completion-service';

export default interface MemoryService {
  predictSummary(messages: Message[]): Promise<InteractionEvent[]>;
}

export class LangchainMemoryService implements MemoryService {
  constructor(public readonly model: BaseLanguageModelInterface) {}

  async predictSummary(messages: Message[]) {
    const memory = new ConversationSummaryMemory({
      memoryKey: 'chat_history',
      llm: this.model,
    });

    const lcMessages = messages.map(convertToMessage);

    const summary = await memory.predictNewSummary(lcMessages, '');
    return [
      new PromptInteractionEvent(
        PromptType.AppMapStats,
        'system',
        buildPromptDescriptor(PromptType.ConversationSummary)
      ),
      new ContextItemEvent(PromptType.ConversationSummary, ContextItemRequestor.Memory, summary),
    ];
  }
}

export const NaiveMemoryService: MemoryService = {
  // eslint-disable-next-line @typescript-eslint/require-await
  async predictSummary(messages: Message[]) {
    const concatenatedMessages = messages.map((message) => message.content).join('\n');
    return [
      new PromptInteractionEvent(
        PromptType.AppMapStats,
        'system',
        buildPromptDescriptor(PromptType.ConversationSummary)
      ),
      new ContextItemEvent(
        PromptType.ConversationSummary,
        ContextItemRequestor.Memory,
        concatenatedMessages
      ),
    ];
  },
};
