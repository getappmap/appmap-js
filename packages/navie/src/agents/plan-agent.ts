import { Agent, AgentOptions } from '../agent';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
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

Your response should include the following elements:

* **Title**: The title is the most important part of a plan. Here are some best practices for good titles:

  - Phrase the title as an imperative command starting with a verb (like a good commit message)
  - Be a descriptive as you can with the limited characters allowed
  - Think to yourself as you write the title, "To complete this issue, I need to: {TITLE}"

* **Problem** Succinct description of the issue.

* **Analysis** In this section describe your reasoning about how best to solve the issue.
  Get to the bottom of it and discuss in detail what are the causes, effects and what the defect
  or requirement is.

* **Solution** Describes the proposed solution to the issue.

* **Proposed Changes** This section suggests which files should be changed in order to solve the issue.

Each item in the \`Proposed Changes\` section SHOULD include the location (path and line number if possible)
of the file that should be modified.

DO provide a detailed description of the necessary changes.
DO suggest changes to existing, non-test code files.
DO NOT include a code snippet.
DO NOT generate changes in test code, test cases, or documentation.
DO NOT propose the creation of new files, unless it's absolutely necessary.

**Examples**

Title: Spike on method of TCS storage for workspace tagging

Title: Implement Content Policy Detail Page "Created by" section to render user name and avatar

Title: Add filters for CPS search to fetch Jira or Confluence results

Change: \`app/view/card.vue\` Implement link from the app blocking rule card to the app blocking progress tracker \`app/view/progress.vue\`.
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
    if (lookupContext) {
      const vectorTerms = await this.vectorTermsService.suggestTerms(options.aggregateQuestion);
      const tokenCount = tokensAvailable();
      const context = await this.lookupContextService.lookupContext(vectorTerms, tokenCount);
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
