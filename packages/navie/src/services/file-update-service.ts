import { ChatOpenAI } from '@langchain/openai';
import { warn } from 'console';
import { readFile, writeFile } from 'fs/promises';
import OpenAI from 'openai';
import InteractionHistory from '../interaction-history';

export type FileUpdate = {
  file: string;
  content: string;
};

const SYSTEM_PROMPT = `**File Change Applier**

Your job is to apply a suggested code change. You'll be provided with the existing code
and the suggested change. You should apply the change to the existing code and return the updated code.

Your response should be the raw text of the updated code.
`;

export default class FileUpdateService {
  constructor(
    public history: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async apply(fileUpdate: FileUpdate): Promise<void> {
    const fileContents = await readFile(fileUpdate.file, 'utf8');

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
        content: `<existing-code>${fileContents}</existing-code>`,
        role: 'user',
      },
      {
        content: `<suggested-change>${fileUpdate.content}</suggested-change>`,
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
    warn(`File change response:\n${rawResponse}`);

    await writeFile(fileUpdate.file, rawResponse, 'utf8');
  }
}
