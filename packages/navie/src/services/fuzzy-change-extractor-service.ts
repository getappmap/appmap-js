/* eslint-disable no-cond-assign */
/* eslint-disable no-await-in-loop */
import { warn } from 'console';

import InteractionHistory from '../interaction-history';
import { Suggestion } from '../lib/file-update';
import { ChatHistory, ClientRequest } from '../navie';
import Oracle from '../lib/oracle';
import FileChangeExtractorService from './file-change-extractor-service';

const EXTRACT_PROMPT = `**File Change Extractor**

Your job is to examine a Markdown document that contains a mixture of text and
suggested code changes. You'll be provided with a file name.

You should find the code block that contains the suggested change for best matching file name,
return the code block, and the line number where the change should be made.

Your response should be the raw text of the code block.

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

def add_one(x):
  return x + 1
`;

export default class FuzzyChangeExtractorService {
  constructor(
    public history: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async extractFile(
    clientRequest: ClientRequest,
    chatHistory: ChatHistory | undefined,
    fileName: string
  ): Promise<Suggestion | undefined> {
    const messages = FileChangeExtractorService.buildMessages(clientRequest, chatHistory);
    if (!messages) {
      warn('No messages found for extractFile');
      return undefined;
    }

    const tryExtract = async (): Promise<Suggestion | undefined> => {
      const oracle = new Oracle('Extract file', EXTRACT_PROMPT, this.modelName, this.temperature);
      const content = await oracle.ask(messages, `File name: ${fileName}`);
      if (!content) return undefined;

      return {
        file: fileName,
        content,
      };
    };

    const sanitizeContent = (suggestion: Suggestion) => {
      const { content } = suggestion;

      const fenceRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
      let match: RegExpExecArray | null;
      const codeBlocks = new Array<string>();
      while ((match = fenceRegex.exec(content)) !== null) {
        codeBlocks.push(match[1]);
      }
      if (codeBlocks.length) suggestion.content = codeBlocks.join('\n');
    };

    // Try tryExtract up to 3 times
    for (let i = 0; i < 3; i += 1) {
      const result = await tryExtract();
      if (result) {
        sanitizeContent(result);
        warn(`Extracted file ${result.file}:\n${result.content}`);
        return result;
      }
    }

    warn(`Failed to extract file ${fileName}`);
    return undefined;
  }
}
