import OpenAI from 'openai';
import { warn } from 'console';
import { ChatOpenAI } from '@langchain/openai';

import InteractionHistory from '../interaction-history';
import { FileUpdate } from './file-update-service';
import { contentBetween } from './contentBetween';

const SYSTEM_PROMPT = `**File Change Extractor**

Your job is to examine a Markdown file that contains a mixture of text and
suggested code changes. You'll be provided with a file name.

You should find the code block that contains the suggested change for best matching file name,
return the code block, and the line number where the change should be made.

Your response should be JSON.

* **file**: The name of the file to be changed.
* **content**: The suggested code that will be placed into the file.

**Example input**

<markdown-data>
## Suggested code change
\`\`\`python
# test.py
def some_function():
  return 1
\`\`\`
</markdown-data>

<file-name>
test.py
</file-name>

**Example output**

\`\`\`json
{
  "file": "test.py",
  "content": "def some_function():\\n  return 1"
}
`;

export default class FileChangeExtractorService {
  constructor(
    public history: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async extract(chatHistory: string[], fileName: string): Promise<FileUpdate> {
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
        content: `<markdown-data>${chatHistory.join('\n\n')}</markdown-data>`,
        role: 'user',
      },
      {
        content: `<file-name>${fileName}</file-name>`,
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

    let fileUpdate: FileUpdate;
    {
      let responseText = rawResponse;
      responseText = contentBetween(responseText, '```json', '```');
      responseText = responseText.trim();
      fileUpdate = JSON.parse(responseText) as FileUpdate;
    }
    return fileUpdate;
  }
}
