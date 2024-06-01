/* eslint-disable no-await-in-loop */

import { ChatHistory } from '../navie';
import Command, { CommandRequest } from '../command';
import FileChangeExtractorService from '../services/file-change-extractor-service';
import FileUpdateService from '../services/file-update-service';

export default class ApplyCommand implements Command {
  constructor(
    public fileChangeExtractor: FileChangeExtractorService,
    public fileUpdateService: FileUpdateService
  ) {}

  async *execute(
    request: CommandRequest,
    chatHistory?: ChatHistory | undefined
  ): AsyncIterable<string> {
    let fileNames: string[] | undefined;
    if (request.userOptions.booleanValue('all', false) || request.question.trim() === 'all') {
      fileNames = await this.fileChangeExtractor.listFiles(request, chatHistory);
    } else if (request.question.trim()) {
      fileNames = [request.question.trim()];
    }

    if (!fileNames || fileNames.length === 0) {
      yield 'No file changes found in the conversation.\n';
      return;
    }

    for (const fileName of fileNames) {
      const fileUpdates = await this.fileChangeExtractor.extractFile(
        request,
        chatHistory,
        fileName
      );
      if (!fileUpdates) {
        yield `Unable to parse file change ${fileName}. Please try again.\n`;
        return;
      }

      yield `File change parsed successfully for ${fileName}\n`;

      for (const fileUpdate of fileUpdates) {
        yield `Applying file update for ${fileUpdate.file}\n`;
        const messages = await this.fileUpdateService.apply(fileUpdate);
        if (messages) {
          for await (const message of messages) {
            yield message;
          }
        }
      }
    }
  }
}
