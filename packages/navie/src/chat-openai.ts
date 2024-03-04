import { ChatOpenAI, OpenAIChatInput } from '@langchain/openai';

export default function buildChatOpenAI(chatInput: Partial<OpenAIChatInput>): ChatOpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');

  chatInput.openAIApiKey = process.env.OPENAI_API_KEY;
  return new ChatOpenAI(chatInput);
}
