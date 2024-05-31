/* eslint-disable no-await-in-loop */
import { warn } from 'console';

import InteractionHistory from '../interaction-history';
import { FileUpdate } from './file-update-service';
import { ChatHistory, ClientRequest } from '../navie';
import Oracle from '../lib/oracle';
import Message from '../message';

const EXTRACT_PROMPT = `**File Change Extractor**

Your job is to examine a Markdown document that contains a mixture of text and
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

const LIST_PROMPT = `**File Name List Extractor**

Your job is to examine a Markdown document that contains a mixture of text and
suggested code changes.

You should list the names of all the files that have suggested changes in the file.

Your response should be a JSON list of file names.

**Example input**

Content:
\`\`\`python
# add_one.py
def add_one(x):
  return x + 1
\`\`\`

\`\`\`\`python
# subtract_one.py
def subtract_one(x):
  return x - 1
\`\`\`

Example output:
[
  "add_one.py",
  "subtract_one.py"
]
`;

export default class FileChangeExtractorService {
  constructor(
    public history: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async listFiles(
    clientRequest: ClientRequest,
    chatHistory: ChatHistory | undefined
  ): Promise<string[] | undefined> {
    const messages = FileChangeExtractorService.buildMessages(clientRequest, chatHistory);
    if (!messages) {
      warn('No messages found for listFiles');
      return [];
    }

    const oracle = new Oracle('List files', LIST_PROMPT, this.modelName, this.temperature);
    return oracle.ask<string[]>(messages);
  }

  async extractFile(
    clientRequest: ClientRequest,
    chatHistory: ChatHistory | undefined,
    fileName: string
  ): Promise<FileUpdate | undefined> {
    const messages = FileChangeExtractorService.buildMessages(clientRequest, chatHistory);
    if (!messages) {
      warn('No messages found for extractFile');
      return undefined;
    }

    const tryExtract = () => {
      const oracle = new Oracle('Extract file', EXTRACT_PROMPT, this.modelName, this.temperature);
      return oracle.ask<FileUpdate>(messages, `File name: ${fileName}`);
    };

    // Try tryExtract up to 3 times
    for (let i = 0; i < 3; i += 1) {
      const result = await tryExtract();
      if (result) return result;
    }

    warn(`Failed to extract file ${fileName}`);
    return undefined;
  }

  static buildMessages(
    clientRequest: ClientRequest,
    chatHistory: ChatHistory | undefined
  ): Message[] | undefined {
    const history: Message[] = [...(chatHistory || [])];
    if (clientRequest.question) {
      history.push({
        content: clientRequest.question,
        role: 'user',
      });
    }
    if (clientRequest.codeSelection) {
      history.push({
        content: clientRequest.codeSelection,
        role: 'user',
      });
    }
    return history.length > 0 ? history : undefined;
  }
}
