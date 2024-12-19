import { Agent, AgentOptions } from '../agent';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import ContextService from '../services/context-service';
import FileChangeExtractorService from '../services/file-change-extractor-service';
import FileContentFetcher from '../services/file-content-fetcher';

import { filterXmlFencesAroundChangesets, GENERATE_AGENT_FORMAT } from './generate-agent';

export const TEST_AGENT_PROMPT = `**Task: Generate a Test Case**

**About you**

Your name is Navie. You are code generation AI created and maintained by AppMap Inc, and are available to AppMap users as a service.

Your job is to generate test case code. The requirements for the test will be provided by the user.

**About the user**

The user is an experienced software developer who will run and review the generated test case. You can expect the user to be proficient
in software development.

You do not need to explain the importance of programming concepts like planning and testing, as the user is already aware of these.
`;

export const TEST_AGENT_FORMAT = `**Response format**

Your solution must be provided as test code that implements the desired functionality within the project.

To generate the test case, you should analyze the existing test case code in the project. You will be provided
with code snippets of other, related test cases.

DOs and DO NOTs:

* DO begin the code snippet with a comment containing the path to the test case file.
* DO extend an existing test case with new code, rather than creating a new test case.
* DO limit the amount of text explanation you emit to the minimum necessary. The user is primarily interested in the code itself.
* DO provide an explanation of the test case as a comment in the test case code.
* DO generate code rather than test data (e.g. YAML or JSON fixture data), because when you generate
  data changes only, the user will not know how to invoke the test.
* DO NOT propose wrapping the project with other code, running the project in a different environment, wrapping the project with
shell commands, or other workarounds.
* DO NOT invoke the project code through wrappers such as CLI, unless the test case is specifically related to
  CLI argument parsing. Prefer direction invocation of project functions, when possible.
* DO NOT rely on testing exit status codes. Test expression values and expected output directly.
`;

export default class TestAgent implements Agent {
  public temperature = 0;

  constructor(
    public history: InteractionHistory,
    private contextService: ContextService,
    private fileChangeExtractorService: FileChangeExtractorService
  ) {}

  async perform(options: AgentOptions, tokensAvailable: () => number): Promise<void> {
    this.history.addEvent(new PromptInteractionEvent('agent', 'system', TEST_AGENT_PROMPT));

    let formatPrompt: string | undefined;
    if (options.userOptions.stringValue('format') === 'xml') formatPrompt = GENERATE_AGENT_FORMAT;
    else if (options.userOptions.isEnabled('format', true)) formatPrompt = TEST_AGENT_FORMAT;

    if (formatPrompt)
      this.history.addEvent(new PromptInteractionEvent('format', 'system', formatPrompt));

    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.IssueDescription,
        'system',
        buildPromptDescriptor(PromptType.IssueDescription)
      )
    );

    if (options.userOptions.booleanValue('listfiles', true)) {
      const contentFetcher = new FileContentFetcher(
        this.fileChangeExtractorService,
        this.contextService
      );
      await contentFetcher.applyFileContext(options, options.chatHistory);
    }

    await this.contextService.locationContextFromOptions(options);
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

  filter = filterXmlFencesAroundChangesets;
}
