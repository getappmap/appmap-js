import { isNativeError } from 'node:util/types';

import Command, { CommandRequest, hasCodeSelectionArray } from '../command';
import Message from '../message';
import CompletionService from '../services/completion-service';
import LookupContextService from '../services/lookup-context-service';
import { UserContext } from '../user-context';
import { ExplainOptions } from './explain-command';
import { ContextV2 } from '../context';
import z from 'zod';
import VectorTermsService from '../services/vector-terms-service';

// These are the default review domains that will be used in the absence of any user input.
const GENERIC_REVIEW_DOMAINS = `- **Correctness**: Identify bugs, flaws, defects, logical errors, or edge cases that will cause the code to fail. This includes checking for copy-paste errors, incorrect variable usage, and any inconsistencies in the code.
- **Code Quality**: Assess readability, maintainability, and adherence to coding standards and style guidelines.
- **Performance**: Point out any inefficiencies or opportunities for optimization.
- **Security**: Highlight potential security vulnerabilities or risks introduced by the changes.
- **Documentation**: Ensure that the code is well-documented where necessary, including comments and documentation updates.
- **Testing**: Check if the changes are adequately covered by unit tests and suggest additional tests if needed.
- **Compatibility**: Consider the impact on existing functionality, including backward compatibility and integration with other system components.
- **Design and Architecture**: Evaluate whether the code follows good design principles and fits well within the overall architecture.
`;

const SYSTEM_PROMPT = `You are an expert software engineer conducting a code review on a git diff provided for a pull request. The user will specify particular areas of focus for your review. Your task is to analyze the changes thoroughly, concentrating on the specified areas, and provide constructive, professional feedback. While focusing on the areas highlighted by the user, you may also mention critical issues in other aspects if necessary.

Offer clear, actionable suggestions for improvements, and maintain a polite and professional tone throughout your review.`;

// This prompt is used when requesting the final, structured review summary.
const REQUEST_FINAL_SUBMISSION = `Now, using your analysis, summarize the review domains to be presented to the user.

The following guidelines should be considered when summarizing the review:
- Comments should be written in Markdown format.
- When referencing specific code within a comment, use a markdown link to the location if possible. (e.g., [MyClass.java](file:///absolute/path/to/MyClass.java), or [MyClass.java](file://relative/path/to/MyClass.java), do not include line numbers).
- Only your comments will be presented to the user, so they must be actionable, clear, and contain enough context and information to stand alone.
- If something requires additional verification, consider it passing the review but include a comment.
- When deciding on the final result, consider the certainty and presence of defective code in the analysis. If uncertain, or no examples of defective code are present, consider accepting the review and leaving comments as consideration point for the developer. - 
`;

// The expected location of the git diff in the code selection.
export const REVIEW_DIFF_LOCATION = 'git diff';

const reviewDomain = z.object({
  name: z
    .string()
    .describe(
      'The display name of the domain being reviewed to be presented to the user. Use title case.'
    ),
  reasoning: z
    .string()
    .describe(
      'This property should contain step by step chain of thought reasoning to conclude which result will be given.'
    ),
  result: z
    .enum(['accept', 'reject'])
    .describe(
      'The final result of the review. `accept` means the changes related to this domain are production quality, `reject` means that feedback should be addressed before merging to production.'
    ),
  comments: z
    .array(
      z
        .string()
        .describe(
          'A specific comment, suggested action, or considtion for improvements to be presented to the developer in Markdown format.'
        )
    )
    .describe('An array of comments or suggestions for improvements related to this domain.'),
});

const ReviewSummary = z.object({
  reviewDomains: reviewDomain
    .array()
    .describe('Each domain being reviewed should contain its own review domain object.'),
});

/**
 * This error is thrown when the git diff cannot be resolved.
 */
class GitDiffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitDiffError';
  }
}

type ReviewAnalysis = AsyncGenerator<string, readonly Message[], void>;

export default class ReviewCommand implements Command {
  constructor(
    private readonly options: ExplainOptions,
    private readonly completionService: CompletionService,
    private readonly lookupContextService: LookupContextService,
    private readonly vectorTermsService: VectorTermsService
  ) {}

  /**
   * Builds the user prompt to be sent to the LLM. If the user specifies additional text within the
   * question or as pinned items, they will override the default prompt.
   * @param question The question provided by the user.
   * @param pinnedItems The pinned items to be included in the user prompt.
   */
  private static buildUserPrompt(question: string, pinnedItems: ContextV2.ContextResponse): string {
    const userQuestion = question.trim().replace(/^review\s*/, '');
    const userProvidedPrompt = Math.max(userQuestion.length, pinnedItems.length) > 0;
    let userPrompt = GENERIC_REVIEW_DOMAINS;
    if (userProvidedPrompt) {
      userPrompt = [
        userQuestion,
        ...pinnedItems.map((cs) =>
          ContextV2.isFileContextItem(cs)
            ? `<${cs.type} location="${cs.location}">\n${cs.content}\n</${cs.type}>`
            : `<${cs.type}>\n${cs.content}\n</${cs.type}>`
        ),
      ]
        .filter(Boolean)
        .join('\n\n');
    }
    return userPrompt;
  }

  /**
   * Builds the initial messages to be sent to the LLM before the review analysis.
   * @param userPrompt The user prompt to be sent to the LLM.
   * @param gitDiff The git diff to be reviewed.
   * @param context The context to be included in the user prompt.
   */
  private static buildMessages(
    userPrompt: string,
    gitDiff: UserContext.CodeSnippetItem,
    context: ContextV2.ContextResponse
  ): Message[] {
    const contextMessage = context
      .map((item) =>
        ContextV2.isFileContextItem(item)
          ? `<${item.type} location="${item.location}">\n${item.content}\n</${item.type}>`
          : `<${item.type}>\n${item.content}\n</${item.type}>`
      )
      .join('\n');
    return [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `I will provide you with a \`git diff\` for the current branch as well as some related code context.

Provide a detailed, line-by-line analysis of the change, highlighting any issues related to the review domains. Organize your response by each code chunk or diff hunk but do not include any code snippets. If something looks wrong, explicitly point out the issue.

Do not blindly trust named indentifiers. Instead, try to understand the code and its context.

---

Here is the diff:
<diff>
${gitDiff.content}
</diff>

Here is some related context, which you can use to help you understand the changes:
<context>
${contextMessage}
</context>

Here are the requested review domains:
<review-domains>
${userPrompt}
</review-domains>
`,
      },
    ];
  }

  /**
   * Retrieves the git diff from the code selection.
   * @param req The command request.
   */
  private static getGitDiff(
    req: CommandRequest & { codeSelection: UserContext.ContextItem[] }
  ): UserContext.CodeSnippetItem {
    const gitDiff = req.codeSelection.find(
      (cs): cs is UserContext.CodeSnippetItem =>
        cs.type === 'code-snippet' && cs.location === REVIEW_DIFF_LOCATION
    );
    if (!gitDiff) {
      throw new GitDiffError('Unable to obtain the diff for the current branch. Please try again.');
    }

    if (gitDiff.content.trim().length === 0) {
      throw new GitDiffError('The base is the same as the head. A review cannot be performed.');
    }

    return gitDiff;
  }

  /**
   * Performs a context lookup for pinned items, excluding the git diff.
   * @param codeSelection The code selection provided by the user.
   * @param gitDiff The git diff to be reviewed.
   */
  private async getPinnedItems(
    codeSelection: readonly UserContext.ContextItem[],
    gitDiff: UserContext.ContextItem
  ): Promise<ContextV2.ContextResponse> {
    const pinnedItems = codeSelection.filter((cs) => cs !== gitDiff);
    const locations = pinnedItems.filter(UserContext.hasLocation).map((cs) => cs.location);
    let pinnedItemLookup: ContextV2.ContextResponse = [];
    if (locations.length > 0) {
      pinnedItemLookup = await this.lookupContextService.lookupContext(
        [],
        this.options.tokenLimit,
        { locations }
      );
    }

    // For backwards compatibility, include the code selections which have been sent
    // without a location.
    pinnedItemLookup.push(
      ...pinnedItems
        .filter(UserContext.isCodeSelectionItem)
        .map((cs) => ({ ...cs, type: ContextV2.ContextItemType.CodeSelection }))
    );

    return pinnedItemLookup;
  }

  /**
   * This function is responsible for context lookups and providing generation of the initial
   * review analysis.
   * @param req The command request.
   * @param gitDiff The git diff to be reviewed.
   * @returns The review analysis generator, yielding tokens as they are generated and the messages
   *          that were sent to the LLM.
   */
  private async *performReviewAnalysis(
    req: CommandRequest & { codeSelection: UserContext.ContextItem[] },
    gitDiff: UserContext.CodeSnippetItem
  ): ReviewAnalysis {
    const pinnedItems = await this.getPinnedItems(req.codeSelection, gitDiff);
    const userPrompt = ReviewCommand.buildUserPrompt(req.question, pinnedItems);
    const vectorTerms = await this.vectorTermsService.suggestTerms(
      [gitDiff.content, userPrompt].join('\n')
    );
    const context = await this.lookupContextService.lookupContext(
      vectorTerms,
      this.options.tokenLimit
    );
    const messages: Message[] = ReviewCommand.buildMessages(userPrompt, gitDiff, context);
    const completion = this.completionService.complete(messages, {
      temperature: 0.0,
    });

    for await (const token of completion) yield token;
    return messages;
  }

  /**
   * This function is responsible for ingesting the review analysis and generating the final review summary.
   * @param reviewAnalysis The review analysis generator.
   * @param verbose If true, emits the diff and the review analysis as they are generated.
   */
  private async *performReviewSummary(
    reviewAnalysis: ReviewAnalysis,
    verbose?: boolean
  ): AsyncIterable<string> {
    let reviewBuffer = '';
    let chatHistory: readonly Message[] = [];
    for (;;) {
      const { value, done } = await reviewAnalysis.next();
      if (done) {
        chatHistory = value;
        if (verbose) yield '\n';
        break;
      } else {
        reviewBuffer += value;
        if (verbose) yield value;
      }
    }

    const summary = await this.completionService.json(
      [
        ...chatHistory,
        {
          role: 'assistant',
          content: reviewBuffer,
        },
        {
          role: 'user',
          content: REQUEST_FINAL_SUBMISSION,
        },
      ],
      ReviewSummary,
      {
        temperature: 0.0,
      }
    );

    if (!summary) {
      yield 'The review summary could not be generated. Please try again.';
      return;
    }

    // Failed domains with the highest number of comments are shown first.
    const sortedDomains = summary.reviewDomains.sort((a, b) => {
      if (a.result === b.result) {
        return b.comments.length - a.comments.length;
      }
      return a.result === 'accept' ? 1 : -1;
    });

    for (const { name, result, comments, reasoning } of sortedDomains) {
      yield `## ${result === 'accept' ? '✅' : '❌'} ${name}\n`;
      yield '#### Summary\n';
      yield reasoning;
      yield '\n';

      if (comments.length) {
        yield result === 'accept' ? '#### Considerations\n' : '#### Recommended Actions\n';
        yield comments.map((c) => `- ${c}`).join('\n');
        yield '\n';
      }
    }
  }

  async *execute(req: CommandRequest): AsyncIterable<string> {
    if (!hasCodeSelectionArray(req)) {
      yield 'No code selection was provided.';
      return;
    }

    let gitDiff: UserContext.CodeSnippetItem;
    try {
      gitDiff = ReviewCommand.getGitDiff(req);
    } catch (e) {
      if (e instanceof GitDiffError) {
        yield e.message;
      } else {
        throw e;
      }
      return;
    }

    const verbose = req.userOptions.booleanValue('verbose', false);
    if (verbose) {
      yield '```diff\n';
      yield gitDiff.content;
      yield '\n```\n';
    }
    try {
      const reviewAnalysis = this.performReviewAnalysis(req, gitDiff);
      yield* this.performReviewSummary(reviewAnalysis, verbose);
    } catch (e) {
      // Handle token limit exceeded errors
      // TODO note this is a hotfix for copilot context length messages.
      // A proper fix is needed, likely involving:
      // - decoupling token reducer service from the completion service
      // - making completion services throw appropriate errors on token limit exceeded
      // - making the review command handle those errors
      if (isNativeError(e)) {
        const tokenLimitMatch = e.message.match(/maximum context length is (\d+)/i);
        if (tokenLimitMatch) {
          const tokenLimit = parseInt(tokenLimitMatch[1], 10);
          if (!isNaN(tokenLimit)) {
            yield formatTokenLimitMessage(tokenLimit);
            return;
          }
        }
      }
      throw e;
    }
  }
}

/**
 * Format the token limit message to be displayed to the user.
 * @param tokenLimit The token limit to be displayed.
 * @returns The formatted token limit message.
 */
function formatTokenLimitMessage(tokenLimit: number): string {
  return `The review is too large for the model's capacity (${tokenLimit.toLocaleString()} tokens). To proceed with the review, try:

1. Breaking the review into smaller chunks by reviewing fewer files at a time
   (you can use /base=&lt;treeish&gt; to set the base commit)
2. Removing unnecessary context by unpinning files that aren't directly related
3. Using a model with a larger context window, if available`;
}
