import InteractionHistory from '../interaction-history';
import { FileUpdate } from './file-update-service';
import { ChatHistory, ClientRequest } from '../navie';
import Message from '../message';
import Oracle from '../lib/oracle';
import parseJSON from '../lib/parse-json';

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
      this.history.log('[file-change-extractor] No messages found for listFiles');
      return [];
    }

    const oracle = new Oracle('List files', LIST_PROMPT, this.modelName, this.temperature);
    const fileList = await oracle.ask(messages);
    if (!fileList) {
      this.history.log('[file-change-extractor] Failed to list files');
      return undefined;
    }
    return parseJSON(fileList) as string[];
  }

  extractFile(
    clientRequest: ClientRequest,
    chatHistory: ChatHistory | undefined,
    fileName: string
  ): FileUpdate[] | undefined {
    const messages = FileChangeExtractorService.buildMessages(clientRequest, chatHistory);
    if (!messages) {
      this.history.log('[file-change-extractor] No messages found for use by extractFile');
      return undefined;
    }

    // Extract <change> tags from the messages. Sort into reverse order, so that the most
    // recently emitted tags are primary.
    const content = FileChangeExtractorService.collectContent(messages);
    const changes = FileChangeExtractorService.extractChanges(content).reverse();

    // Return all changes that apply to the requested file name.
    const fileChanges = changes.filter((change) => change.file === fileName);
    if (fileChanges.length === 0) {
      this.history.log(`No suggested changes found for ${fileName}`);
      return undefined;
    }

    this.history.log(
      `[file-change-extractor] ${fileChanges.length} suggested changes found for ${fileName}`
    );
    return fileChanges;
  }

  static extractChanges(content: string): FileUpdate[] {
    // Search for <change> tags
    const changeRegex = /<change>([\s\S]*?)<\/change>/g;
    let match: RegExpExecArray | null;
    const changes = new Array<FileUpdate>();
    // eslint-disable-next-line no-cond-assign
    while ((match = changeRegex.exec(content)) !== null) {
      const change = match[1];
      const fileRegex = /<file>([\s\S]*?)<\/file>/;
      const originalRegex = /<original>([\s\S]*?)<\/original>/;
      const modifiedRegex = /<modified>([\s\S]*?)<\/modified>/;
      const fileMatch = fileRegex.exec(change);
      const originalMatch = originalRegex.exec(change);
      const modifiedMatch = modifiedRegex.exec(change);
      if (fileMatch && originalMatch && modifiedMatch) {
        changes.push({
          file: fileMatch[1].trim(),
          original: originalMatch[1].trim(),
          modified: modifiedMatch[1].trim(),
        });
      }
    }
    return changes;
  }

  static collectContent(messages: Message[]): string {
    return messages
      .filter((m) => m.role === 'assistant' || m.role === 'user')
      .map((m) => m.content)
      .join('\n\n');
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
