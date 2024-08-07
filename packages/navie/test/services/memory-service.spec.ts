import { ChatOpenAI } from '@langchain/openai';

import { PromptInteractionEvent, ContextItemEvent } from '../../src/interaction-history';
import type Message from '../../src/message';
import MemoryService, { LangchainMemoryService } from '../../src/services/memory-service';
import { ConversationSummaryMemory } from 'langchain/memory';
import { PromptType } from '../../src/prompt';

jest.mock('@langchain/openai');
jest.mock('langchain/memory');

describe('LangchainMemoryService', () => {
  describe('predictSummary', () => {
    let memoryService: MemoryService;
    const messages: Message[] = [
      { role: 'user', content: 'What is your name?' },
      { role: 'system', content: 'I am a bot.' },
      { role: 'user', content: 'How are you?' },
    ];

    beforeEach(() => {
      memoryService = new LangchainMemoryService(new ChatOpenAI());
    });

    it('should add the conversation summary to the context', async () => {
      const mockPredictNewSummary = jest.fn().mockResolvedValue('This is a summary.');
      (ConversationSummaryMemory.prototype as any).predictNewSummary = mockPredictNewSummary;

      const events = await memoryService.predictSummary(messages);
      expect(events.length).toBe(2);

      const [instruction, context]: [PromptInteractionEvent, ContextItemEvent] = events as any;
      expect(instruction).toBeInstanceOf(PromptInteractionEvent);
      expect(context).toBeInstanceOf(ContextItemEvent);

      expect(instruction.type).toEqual('prompt');
      expect(instruction.content).toEqual(expect.stringContaining('**Conversation summary**'));

      expect(context.type).toEqual('contextItem');
      expect(context.promptType).toEqual(PromptType.ConversationSummary);
      expect(context.content).toEqual('This is a summary.');
    });
  });
});
