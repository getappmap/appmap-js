import { ContextV2 } from '../context';
import { ClientRequest, ChatHistory } from '../navie';
import ContextService from './context-service';
import FileChangeExtractorService from './file-change-extractor-service';

export default class FileContentFetcher {
  constructor(
    private fileChangeExtractor: FileChangeExtractorService,
    private contextService: ContextService
  ) {}

  async applyFileContext(
    clientRequest: ClientRequest,
    chatHistory: ChatHistory | undefined
  ): Promise<void> {
    const fileNames = await this.fileChangeExtractor.listFiles(clientRequest, chatHistory);
    if (!fileNames) {
      return undefined;
    }

    await this.contextService.locationContext(fileNames);
  }
}
