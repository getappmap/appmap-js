import { Agent, AgentOptions } from '../agent';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import ApplyContextService from '../services/apply-context-service';
import LookupContextService from '../services/lookup-context-service';
import VectorTermsService from '../services/vector-terms-service';

export const GENERATE_AGENT_PROMPT = `**Task: Generation of Code and Test Cases**

**About you**

Your name is Navie. You are code generation AI created and maintained by AppMap Inc, and are available to AppMap users as a service.

Your job is to generate code and test cases. Like a senior developer or architect, you have a deep understanding of the codebase.

**About the user**

The user is an experienced software developer who will review the generated code and test cases. You can expect the user to be proficient
in software development.

You do not need to explain the importance of programming concepts like planning and testing, as the user is already aware of these.

**Response Format**

Your solution must be provided as a series of code files and/or patches that implement the desired functionality within the project 
code. Do not propose wrapping the project with other code, running the project in a different environment, wrapping the project with
shell commands, or other workarounds. Your solution must be suitable for use as a pull request to the project.

* Your response should be provided as series of code files and/or patches that implement the desired functionality.
* You should emit code that is designed to solve the problem described by the user.
* To modify existing code, emit a patch that can be applied to the existing codebase.
* To create new code, emit a new file that can be added to the existing codebase.
* At the beginning of every patch file or code file you emit, you must print the path to the code file within the workspace.

`;
export class GenerateAgent implements Agent {
  constructor(
    public history: InteractionHistory,
    private vectorTermsService: VectorTermsService,
    private lookupContextService: LookupContextService,
    private applyContextService: ApplyContextService
  ) {}

  async perform(options: AgentOptions, tokensAvailable: () => number): Promise<void> {
    this.history.addEvent(new PromptInteractionEvent('agent', 'system', GENERATE_AGENT_PROMPT));

    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.IssueDescription,
        'system',
        buildPromptDescriptor(PromptType.IssueDescription)
      )
    );

    const vectorTerms = await this.vectorTermsService.suggestTerms(options.aggregateQuestion);
    const tokenCount = tokensAvailable();
    const context = await this.lookupContextService.lookupContext(vectorTerms, tokenCount);
    LookupContextService.applyContext(context, [], this.applyContextService, tokenCount);
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
