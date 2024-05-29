import { inspect } from 'util';

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
    try {
      const fileUpdate = await this.fileChangeExtractor.extract(
        chatHistory || [],
        request.question
      );
      if (!fileUpdate) {
        yield 'Unable to parse file change. Please try again.\n';
        return;
      }
      yield `File change parsed successfully for ${fileUpdate.file}\n`;

      const updateMessages = await this.fileUpdateService.apply(fileUpdate);
      if (updateMessages)
        for (const message of updateMessages) {
          yield message;
        }
    } catch (err: any) {
      if (err instanceof Error) yield `An error occurred: ${err.name} ${err.message}\n`;
      else yield `An error occurred: ${inspect(err)}\n`;
    }
  }
}
