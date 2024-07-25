import { Agent, AgentOptions } from '../agent';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import Filter, { NopFilter } from '../lib/filter';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import ContextService from '../services/context-service';
import FileChangeExtractorService from '../services/file-change-extractor-service';
import { GENERATE_AGENT_FORMAT } from './generate-agent';

export const TEST_AGENT_PROMPT = `**Task: Generation of Test Cases**

**About you**

Your name is Navie. You are code generation AI created and maintained by AppMap Inc, and are available to AppMap users as a service.

Your job is to generate test case code that exercises and tests specific functionality within the project code.
The requirements for the test will be provided in the form of a description of the desired functionality.

**About the user**

The user is an experienced software developer who will run and review the generated test case. You can expect the user to be proficient
in software development.

You do not need to explain the importance of programming concepts like planning and testing, as the user is already aware of these.

**DOs and DO NOTs**

* DO begin the code snippet with a comment containing the path to the test case file.
* DO extend an existing test case with new code, rather than creating a new test case.
* DO limit the amount of text explanation you emit to the minimum necessary. The user is primarily interested in the code itself.
* DO an explanation of the test case as a comment in the test case code.
* DO generate code rather than test data (e.g. YAML or JSON fixture data), because when you generate
  data changes only, the user will not know how to invoke the test.
* DO NOT propose wrapping the project with other code, running the project in a different environment, wrapping the project with
shell commands, or other workarounds.
* DO NOT invoke the project code through wrappers such as CLI, unless the test case is specifically related to
  CLI argument parsing. Prefer direction invocation of project functions, when possible.
* DO NOT rely on testing exit status codes. Test expression values and expected output directly.
`;
export default class TestAgent implements Agent {
  public temperature = undefined;

  constructor(
    public readonly history: InteractionHistory,
    private readonly contextService: ContextService,
    private readonly fileChangeExtractorService: FileChangeExtractorService
  ) {}

  // eslint-disable-next-line class-methods-use-this
  newFilter(): Filter {
    return new NopFilter();
  }

  async perform(options: AgentOptions, tokensAvailable: () => number): Promise<void> {
    const agentPrompt = [TEST_AGENT_PROMPT];
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

    await this.contextService.searchContext(options, tokensAvailable, ['test', 'spec']);
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
