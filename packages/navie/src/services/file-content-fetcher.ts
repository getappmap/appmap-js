import { ClientRequest, ChatHistory } from '../navie';
import ContextService from './context-service';
import FileChangeExtractorService from './file-change-extractor-service';

/**
 * Used to detect file mentions within a chat interaction and to fetch their content using helper services.
 */
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
