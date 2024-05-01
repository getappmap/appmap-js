import { inspect } from 'util';
import { Agent, AgentOptions } from '../agent';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import FileChangeExtractorService from '../services/file-change-extractor-service';
import FileUpdateService from '../services/file-update-service';

export const EDIT_AGENT_PROMPT = `**Task: Edit Code Files**

**About you**

Your name is Navie. You are code generation AI created and maintained by AppMap Inc, and are available to AppMap users as a service.

Your job is to edit a file with a code change provided by the user, and respond with the edited file.

**About the user**

The user is an experienced software developer.

**About your response**

Your response should be the edited file with the code change provided by the user.

Do not wrap the response in a code block, Markdown, or code fences. The response should be the raw text of the edited file.
`;

export class EditAgent implements Agent {
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
    this.history.addEvent(new PromptInteractionEvent('agent', 'system', EDIT_AGENT_PROMPT));

    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.Specification,
        'system',
        buildPromptDescriptor(PromptType.Specification)
      )
    );

    const messages = new Array<string>();
    try {
      const fileModification = await this.fileChangeExtractor.extract(
        options.chatHistory,
        options.question
      );
      await this.fileUpdateService.apply(fileModification);
      messages.push(`File change applied successfully to ${fileModification.file}`);
    } catch (err: any) {
      messages.push(`An error occurred: ${inspect(err)}`);
    }

    return messages;
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
