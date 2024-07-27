import { Agent, AgentOptions } from '../agent';
import { ContextV2 } from '../context';
import InteractionHistory, {
  ContextItemEvent,
  PromptInteractionEvent,
} from '../interaction-history';
import Filter, { NopFilter } from '../lib/filter';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import ContextService, { contextOptionsFromAgentOptions } from '../services/context-service';
import FileChangeExtractorService from '../services/file-change-extractor-service';
import LookupContextService from '../services/lookup-context-service';

export const GENERATE_AGENT_PROMPT = `**Task: Generation of Code**

**About you**

Your name is Navie. You are code generation AI created and maintained by AppMap Inc, and are available to AppMap users as a service.

Your job is to generate code and test cases. Like a senior developer or architect, you have a deep understanding of the codebase.

**About the user**

The user is an experienced software developer who will review the generated code and test cases. You can expect the user to be proficient
in software development.

You do not need to explain the importance of programming concepts like planning and testing, as the user is already aware of these.
`;

export const GENERATE_AGENT_FORMAT = `**Response Format**

Your solution must be provided as a series of code files and snippets that implement the desired functionality within the project 
code. Do not propose wrapping the project with other code, running the project in a different environment, wrapping the project with
shell commands, or other workarounds. Your solution must be suitable for use as a pull request to the project.

* Your response should be provided as series of code files and/or snippets that implement the desired functionality.
* You should emit code that is designed to solve the problem described by the user.
* To modify existing code, emit a code snippet that augments or replaces code in an existing file.
  Tell the user which file they need to modify.
* To create new code, emit a new file that can be added to the existing codebase. Tell the user where to add the new file.
* At the beginning of every patch file or code file you emit, you must print the path to the code file within the workspace.
* Limit the amount of text explanation you emit to the minimum necessary. The user is primarily interested in the code itself.
`;

export default class GenerateAgent implements Agent {
  // TODO:
  // Skip AppMap statistics and Project Context
  // Skip Code Editor prompt?

  constructor(
    public readonly history: InteractionHistory,
    private readonly contextService: ContextService,
    private readonly fileChangeExtractorService: FileChangeExtractorService
  ) {}

  // eslint-disable-next-line class-methods-use-this
  get temperature(): number {
    return 0;
  }

  // eslint-disable-next-line class-methods-use-this
  newFilter(): Filter {
    return new NopFilter();
  }

  async perform(options: AgentOptions, tokensAvailable: () => number): Promise<void> {
    const agentPrompt = [GENERATE_AGENT_PROMPT];
    // With the /noformat option, the user will explain the desired output format in their message.
    if (options.userOptions.isEnabled('format', true)) {
      agentPrompt.push(GENERATE_AGENT_FORMAT);
    }

    this.history.addEvent(new PromptInteractionEvent('agent', 'system', agentPrompt.join('\n\n')));

    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.IssueDescription,
        'system',
        buildPromptDescriptor(PromptType.IssueDescription)
      )
    );

    // Locate named file in the history and retrieve their full contents.
    // Code generation doesn't work well if it's only presented with snippets.
    const fileNames = await this.fileChangeExtractorService.listFiles(options, options.chatHistory);
    if (fileNames && fileNames.length > 0) await this.contextService.locationContext(fileNames);

    await this.contextService.searchContext(
      options.aggregateQuestion,
      contextOptionsFromAgentOptions(options),
      tokensAvailable
    );
  }

  applyQuestionPrompt(question: string): void {
    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.IssueDescription,
        'user',
        buildPromptValue(PromptType.IssueDescription, question)
      )
    );
  }
}
