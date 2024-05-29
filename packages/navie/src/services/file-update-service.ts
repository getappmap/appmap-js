import { ChatOpenAI } from '@langchain/openai';
import { warn } from 'console';
import { readFile, writeFile } from 'fs/promises';
import OpenAI from 'openai';
import InteractionHistory from '../interaction-history';
import trimFences from '../lib/trim-fences';

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

  async apply(fileUpdate: FileUpdate): Promise<string[] | void> {
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
    warn(`File change response:\n`);
    // eslint-disable-next-line no-await-in-loop
    for await (const token of response) {
      process.stderr.write(token.choices.map((choice) => choice.delta.content).join(''));
      tokens.push(token.choices.map((choice) => choice.delta.content).join(''));
    }
    const rawResponse = tokens.join('');
    const codeResponse = trimFences(rawResponse);
    await writeFile(fileUpdate.file, codeResponse, 'utf8');

    return [`File change applied to ${fileUpdate.file}.\n`];
  }
}
