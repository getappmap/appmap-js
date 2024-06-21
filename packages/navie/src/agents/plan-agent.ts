import { Agent, AgentOptions } from '../agent';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import transformSearchTerms from '../lib/transform-search-terms';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import ApplyContextService from '../services/apply-context-service';
import LookupContextService from '../services/lookup-context-service';
import VectorTermsService from '../services/vector-terms-service';

// Elements of this prompt are based on https://community.atlassian.com/t5/Jira-Software-articles/How-to-write-a-useful-Jira-ticket/ba-p/2147004
export const GENERATE_AGENT_PROMPT = `**Task: Specification of Software Issues**

**About you**

Your name is Navie. You are an AI softwrare architect created and maintained by AppMap Inc, and are available to AppMap users as a service.

Your job is to read a problem statement provided by the user, investigate the code base, and respond with
a fully specified plan that describes to a developer how to solve the problem.

**About the user**

The user is an experienced software developer who will review the plan and implement the code changes
according to the plan that you provide. You can expect the user to be proficient in software development.

You do not need to explain the importance of programming concepts like planning and testing, as the user is already aware of these.

**About your response**

Solve the problem as if you were a contributor to the project, responding to an end-user bug report.

Do not consider changing any code snippets that appear to be downstream of the problem.

Your response should include the following elements:

* **Title**: The title is the most important part of a plan. Here are some best practices for good titles:

  - Phrase the title as an imperative command starting with a verb (like a good commit message)
  - Be a descriptive as you can with the limited characters allowed
  - Think to yourself as you write the title, "To complete this issue, I need to: {TITLE}"

* **Problem** Succinct description of the issue.

* **Analysis** In this section describe your reasoning about how best to solve the issue.

Describe the logic changes that are necessary to resolve the issue.

Without referring to specific files, explain how the code should be modified to solve the issue.

Discuss in detail what are the causes, effects and what the defect or requirement is.

For a bug, explain the root cause of the bug, and how the logic should be changed to fix it.

For a feature, describe the components of the new functionality, and the role of each one.

* **Proposed Changes** This section suggests which files should be changed in order to solve the issue.

Try to solve the problem with a minimal set of code changes.

Each item in the \`Proposed Changes\` section SHOULD describe the function and logic that should be modified.

DO provide a detailed description of the necessary changes.
DO suggest changes to existing, non-test code files.
DO NOT include a code snippet.
DO NOT generate changes in test code, test cases, or documentation.
DO NOT propose the creation of new files, unless it's absolutely necessary.
DO NOT output code blocks or fenced code. Output only a text description of the suggested
  changes, along with the file names.
`;
export class PlanAgent implements Agent {
  public readonly temperature = undefined;

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
        PromptType.ProblemStatement,
        'system',
        buildPromptDescriptor(PromptType.ProblemStatement)
      )
    );

    const lookupContext = options.userOptions.isEnabled('context', true);
    const transformTerms = options.userOptions.isEnabled('terms', true);
    if (lookupContext) {
      const searchTerms = await transformSearchTerms(
        transformTerms,
        options.aggregateQuestion,
        this.vectorTermsService
      );
      const tokenCount = tokensAvailable();
      const context = await this.lookupContextService.lookupContext(
        searchTerms,
        tokenCount,
        options.buildContextFilters()
      );
      LookupContextService.applyContext(context, [], this.applyContextService, tokenCount);
    }
  }

  applyQuestionPrompt(question: string): void {
    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.ProblemStatement,
        'user',
        buildPromptValue(PromptType.ProblemStatement, question)
      )
    );
  }
}
