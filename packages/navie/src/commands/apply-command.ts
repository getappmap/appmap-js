/* eslint-disable no-await-in-loop */

import { ChatHistory } from '../navie';
import Command, { CommandRequest } from '../command';
import FileChangeExtractorService from '../services/file-change-extractor-service';
import FileUpdateService from '../services/file-update-service';
import Message from '../message';

export default class ApplyCommand implements Command {
  constructor(
    public fileChangeExtractor: FileChangeExtractorService,
    public fileUpdateService: FileUpdateService
  ) {}

  async *execute(
    request: CommandRequest,
    chatHistory?: ChatHistory | undefined
  ): AsyncIterable<string> {
    const history: Message[] = [...(chatHistory || [])];
    if (request.codeSelection) {
      history.push({
        content: request.codeSelection,
        role: 'user',
      });
    }
    if (!history) {
      yield 'Please begin a conversation, or provide a code selection, before using @apply.\n';
      return;
    }

    let fileNames: string[] | undefined;
    if (request.userOptions.booleanValue('all', false) || request.question.trim() === 'all') {
      fileNames = await this.fileChangeExtractor.listFiles(history);
    } else if (request.question.trim()) {
      fileNames = [request.question.trim()];
    }

    if (!fileNames || fileNames.length === 0) {
      yield 'No file changes found in the conversation.\n';
      return;
    }

    for (const fileName of fileNames) {
      const fileUpdate = await this.fileChangeExtractor.extractFile(history, fileName);
      if (!fileUpdate) {
        yield `Unable to parse file change ${fileName}. Please try again.\n`;
        return;
      }

      yield `File change parsed successfully for ${fileUpdate.file}\n`;

      const messages = await this.fileUpdateService.apply(fileUpdate);
      if (messages) {
        for await (const message of messages) {
          yield message;
        }
      }
    }
  }
}
