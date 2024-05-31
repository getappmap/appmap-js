import { dump } from 'js-yaml';
import Command, { CommandRequest } from '../command';
import { ChatHistory } from '../navie';
import FileChangeExtractorService from '../services/file-change-extractor-service';

export default class ListFilesCommand implements Command {
  constructor(private readonly fileChangeExtractorService: FileChangeExtractorService) {}

  async *execute(request: CommandRequest, chatHistory?: ChatHistory): AsyncIterable<string> {
    const files =
      (await this.fileChangeExtractorService.listFiles(chatHistory, request.codeSelection)) || [];

    const fence = request.userOptions.isEnabled('fence', true);
    const format = request.userOptions.stringValue('format') || 'yaml';

    let contextStr: string;
    if (format === 'yaml') {
      contextStr = dump(files);
    } else {
      contextStr = JSON.stringify(files, null, 2);
    }

    if (fence) yield `\`\`\`${format}\n`;
    yield contextStr;
    if (fence) yield '```\n';
  }
}
