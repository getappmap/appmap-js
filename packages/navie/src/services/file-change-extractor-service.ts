import OpenAI from 'openai';
import { warn } from 'console';
import { ChatOpenAI } from '@langchain/openai';

import InteractionHistory from '../interaction-history';
import { FileUpdate } from './file-update-service';
import parseJSON from '../lib/parse-json';
import { ChatHistory } from '../navie';

const SYSTEM_PROMPT = `**File Change Extractor**

Your job is to examine a Markdown file that contains a mixture of text and
suggested code changes. You'll be provided with a file name.

You should find the code block that contains the suggested change for best matching file name,
return the code block, and the line number where the change should be made.

Your response should be JSON.

* **file**: The name of the file to be changed.
* **content**: The suggested code that will be placed into the file.

**Example input**

Content: Generate a function that adds one to any number
Role: user

Content:
  \`\`\`python
  # add_one.py
  def add_one(x):
    return x + 1
  \`\`\`
Role: assistant

File name: add_one.py

**Example output**

\`\`\`json
{
  "file": "add_one.py",
  "content": "def add_one(x):\n  return x + 1"
}
`;

export default class FileChangeExtractorService {
  constructor(
    public history: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async extract(chatHistory: ChatHistory, fileName: string): Promise<FileUpdate | undefined> {
    const openAI: ChatOpenAI = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
    });

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        content: SYSTEM_PROMPT,
        role: 'system',
      },
    ];

    for (const message of chatHistory) messages.push(message);

    messages.push({
      content: `File name: ${fileName}`,
      role: 'user',
    });

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

    return parseJSON<FileUpdate>(rawResponse);
  }
}
