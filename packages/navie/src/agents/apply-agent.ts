import { inspect } from 'util';
import { Agent, AgentOptions } from '../agent';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptValue } from '../prompt';
import FileChangeExtractorService from '../services/file-change-extractor-service';
import FileUpdateService from '../services/file-update-service';

export default class ApplyAgent implements Agent {
  constructor(
    public history: InteractionHistory,
    public fileChangeExtractor: FileChangeExtractorService,
    public fileUpdateService: FileUpdateService
  ) {}

  // eslint-disable-next-line class-methods-use-this
  get standalone(): boolean {
    return true;
  }

  async perform(options: AgentOptions): Promise<string[]> {
    const messages = new Array<string>();
    try {
      const fileUpdate = await this.fileChangeExtractor.extract(
        options.chatHistory,
        options.question
      );
      if (!fileUpdate) {
        messages.push('Unable to parse file change. Please try again.');
        return messages;
      }
      messages.push(`File change parsed successfully for ${fileUpdate.file}`);

      const updateMessages = await this.fileUpdateService.apply(fileUpdate);
      if (updateMessages) messages.push(...updateMessages);
    } catch (err: any) {
      messages.push(`An error occurred: ${inspect(err)}`);
    }

    return messages.map((msg) => [msg, '\n'].join(''));
  }

  applyQuestionPrompt(question: string): void {
    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.Specification,
        'user',
        buildPromptValue(PromptType.Specification, question)
      )
    );
  }
}
