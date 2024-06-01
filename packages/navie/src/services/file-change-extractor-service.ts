/* eslint-disable no-cond-assign */
/* eslint-disable no-await-in-loop */
import { warn } from 'console';

import InteractionHistory from '../interaction-history';
import { FileUpdate } from './file-update-service';
import { ChatHistory, ClientRequest } from '../navie';
import Oracle from '../lib/oracle';
import Message from '../message';
import parseJSON from '../lib/parse-json';

const EXTRACT_PROMPT = `**File Change Extractor**

Your job is to examine a Markdown document that contains a mixture of text and
suggested code changes. You'll be provided with a file name.

You should find the code block that contains the suggested change for best matching file name,
return the code block, and the line number where the change should be made.

Your response should be an XML <change> object containing the following fields:
- <file>: (optional) The name of the file
- <original>: The original code block
- <modified>: The modified code block

If there are multiple changes for the same file, you should return multiple <change> objects.

Do not enclose the code blocks in triple backticks.

**Example**

<change>
<file>src/sqlfluff/core/file_helpers.py</file>
<original>
def get_encoding(fname: str, config: FluffConfig) -> str:
    """Get the encoding of the file (autodetect)."""
    encoding_config = config.get("encoding", default="autodetect")

    if encoding_config == "autodetect":
        with open(fname, "rb") as f:
            data = f.read()
        return chardet.detect(data)["encoding"]

    return encoding_config
</original>
<modified>
def get_encoding(fname: str, config: FluffConfig) -> str:
    """Get the encoding of the file (autodetect)."""
    try:
        encoding_config = config.get("encoding", default="utf-8")  # Change default to utf-8

        if encoding_config == "autodetect":
            with open(fname, "rb") as f:
                data = f.read()
            return chardet.detect(data)["encoding"]

        return encoding_config
    except UnicodeEncodeError as e:
        click.echo(f"Error detecting encoding for file {fname}: {str(e)}", err=True)
        return "utf-8"
</modified>
</change>
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
    const fileList = await oracle.ask(messages);
    if (!fileList) {
      warn('Failed to list files');
      return undefined;
    }
    return parseJSON(fileList) as string[];
  }

  async extractFile(
    clientRequest: ClientRequest,
    chatHistory: ChatHistory | undefined,
    fileName: string
  ): Promise<FileUpdate[] | undefined> {
    const messages = FileChangeExtractorService.buildMessages(clientRequest, chatHistory);
    if (!messages) {
      warn('No messages found for extractFile');
      return undefined;
    }

    const tryExtract = async (): Promise<FileUpdate[] | undefined> => {
      const oracle = new Oracle('Extract file', EXTRACT_PROMPT, this.modelName, this.temperature);
      const content = await oracle.ask(messages, `File name: ${fileName}`);
      if (!content) return undefined;

      // Search for <change> tags
      const changeRegex = /<change>([\s\S]*?)<\/change>/g;
      let match: RegExpExecArray | null;
      const changes = new Array<FileUpdate>();
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
    };

    // Try tryExtract up to 3 times
    for (let i = 0; i < 3; i += 1) {
      const result = await tryExtract();
      if (result) {
        warn(`Extracted ${result.length} changes for file ${fileName}:\n`);
        result.forEach((change) => {
          warn(`Original:\n${change.original}\nModified:\n${change.modified}\n`);
        });
        return result;
      }
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
