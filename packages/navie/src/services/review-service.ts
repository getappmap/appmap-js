import { z } from 'zod';
import CompletionService from './completion-service';
import LookupContextService from './lookup-context-service';
import { ContextV2 } from '../context';

const ReviewComment = z
  .object({
    reasoning: z
      .string()
      .describe(
        'The reasoning behind the software defect, including an explanation of how and why the software defect is present.'
      ),
    description: z.string().describe('A description of the software defect.'),
    confidence: z
      .number()
      .describe(
        'The confidence that the issue is worth addressing, on a scale of 1 (low) to 10 (high).'
      ),
    severity: z.number().describe('The severity of the issue, on a scale of 1 (low) to 10 (high).'),
    impact: z
      .number()
      .describe('The impact of the issue on the end user, on a scale of 1 (low) to 10 (high).'),
    classification: z
      .array(z.string())
      .describe('The classification of the issue. One word per classification.'),
    relatedFunctions: z
      .array(z.string())
      .describe(
        'A list of related functions that would be useful to review in order to address or understand the issue.'
      ),
    relatedTypes: z
      .array(z.string())
      .describe(
        'A list of related types (class, struct, enum, etc.) that would be useful to review in order to address or understand the issue.'
      ),
    relatedFiles: z
      .array(z.string())
      .describe(
        'A list of related files that would be useful to review in order to address or understand the issue.'
      ),
  })
  .describe('An object representing a potential software defect that will need to be addressed.');

const ReviewReflection = z.object({
  thoughts: z
    .array(z.string())
    .describe(
      'Step by step chain of thought that leads to the conclusion of whether or not the issue is present, accurate, and needs to be addressed.'
    ),
  issue: z.object({
    present: z.boolean().describe('Indicate whether or not the issue is present.'),
    accurate: z
      .boolean()
      .describe('Indicate whether or not the issue description and reasoning is accurate.'),
    needsAddressing: z
      .boolean()
      .describe(
        'Indicate whether or not the issue introduces problematic behavior that should be addressed'
      ),
    description: z
      .string()
      .describe('Restate the description of the issue, updated based on the chain of thought.'),
    confidence: z
      .number()
      .describe(
        'The confidence that the issue is worth addressing, on a scale of 1 (low) to 10 (high), updated based on the chain of thought.'
      ),
    severity: z
      .number()
      .describe(
        'The severity of the issue, on a scale of 1 (low) to 10 (high), updated based on the chain of thought.'
      ),
    impact: z
      .number()
      .describe(
        'The impact of the issue on the end user, on a scale of 1 (low) to 10 (high), updated based on the chain of thought.'
      ),
    classification: z
      .array(z.string())
      .describe(
        'Restate the classification of the issue, updated based on the chain of thought and description. One word per classification.'
      ),
  }),
  valid: z
    .boolean()
    .describe(
      'An overall indication of whether or not the issue is valid, based on issue properties. If no software defect is present, this will be false.'
    ),
});

const ReviewResponseFormat = z.object({
  thoughts: z
    .array(z.string())
    .describe(
      'Step by step chain of thought that explores concerns and potential issues introduced by the code change.'
    ),
  issues: z.array(ReviewComment).describe('A list of issues that will need to be addressed.'),
});

type ReviewResponse = z.infer<typeof ReviewResponseFormat>;

type IssueCompletion = ReviewResponse & { path: string };

type Review = {
  path: string;
  issues: z.infer<typeof ReviewComment>[];
};

export type ChangeSummary = {
  diff: string;
  changes: readonly FileChangeSummary[];
};

type FileChangeSummary = {
  path: string;
  changedSymbols: string[];
  diffChunks: string[];
  content: string;
};

const buildSystemPrompt = (changeSummary: string, content: string) =>
  `You are an expert software engineer tasked with helping another software engineer with a code review. The code review is for the following file. The user will provide you with a diff, already applied to the file, which they would like reviewed.
If the request is unclear, return an empty \`issues\` array.

The following a summary of all changes made, which may include additional changes outside of the file being reviewed. It is useful in understanding the context of the changes.
\`\`\`
${changeSummary}
\`\`\`

The following is the content of the file being reviewed:
\`\`\`
${content}
\`\`\`
`;

const buildValidationPrompt = (content: string) =>
  `You are a world class software engineer interviewing for a position at a top tech company. You will be asked to validate a code review for the following file.

The user will provide you with an issue and reasoning, and you will be asked to determine if the issue valid.

Keep in mind that this is an interview, so you should be as thorough as possible in your response. Some potential issues may be red herrings, so be sure to validate each issue carefully.

\`\`\`
${content}
\`\`\`
`;

export default class ReviewService {
  constructor(
    private readonly completionService: CompletionService,
    private readonly lookupContextService: LookupContextService
  ) {}

  private async validateReviewResponse(
    issue: ReviewResponse['issues'][0],
    fileContent: string
  ): Promise<z.infer<typeof ReviewReflection> | undefined> {
    const searchTerms = [
      ...new Set(
        [...issue.relatedFunctions, ...issue.relatedTypes, ...issue.relatedFiles].flatMap((t) =>
          t.split(/[^a-zA-Z0-9_]/)
        )
      ),
    ];
    console.log('Validating review response, searching for context', searchTerms);
    const context = (await this.lookupContextService.lookupContext(searchTerms, 4000)).filter(
      (c): c is ContextV2.FileContextItem =>
        ['sequence-diagram', 'code-snippet', 'data-request'].includes(c.type)
    );
    let contextStr;
    if (context.length > 0) {
      contextStr = `Here is some additional context that may help you validate the issue:
<context>
${context
  .filter((c): c is ContextV2.FileContextItem =>
    ['sequence-diagram', 'code-snippet', 'data-request'].includes(c.type)
  )
  .map(
    (c) => `<${c.type} location="${c.location} directory="${c.directory}">${c.content}</${c.type}>`
  )
  .join('\n')}
</context>`;
    }

    return this.completionService.json(
      [
        { role: 'system', content: buildValidationPrompt(fileContent) },
        {
          role: 'user',
          content: `The issue I've recieved is as follows:
"${issue.description}

The reasoning given was:
"${issue.reasoning}

${contextStr ?? ''}`,
        },
      ],
      ReviewReflection,
      {
        model: this.completionService.miniModelName,
        temperature: 0.0,
      }
    );
  }

  private async getIssueCompletion(
    changeSummary: string,
    path: string,
    fileContent: string,
    diffChunk: string
  ): Promise<IssueCompletion> {
    const completion = await this.completionService.json(
      [
        { role: 'system', content: buildSystemPrompt(changeSummary, fileContent) },
        {
          role: 'user',
          content: diffChunk,
        },
      ],
      ReviewResponseFormat,
      {
        model: this.completionService.miniModelName,
        temperature: 0.0,
      }
    );
    return {
      thoughts: completion?.thoughts ?? [],
      issues: completion?.issues ?? [],
      path,
    };
  }

  private async getChangeDescription(diff: string): Promise<string> {
    const res = this.completionService.complete(
      [
        {
          role: 'system',
          content:
            'You are a software engineer tasked with creating documentation clear and concise descriptions of changes to code. The user will provide you with a commit log, and your task is to write a pull request description that summarizes the changes. Do not include any code snippets or commit hashes.',
        },
        { role: 'user', content: diff },
      ],
      {
        temperature: 0.0,
      }
    );
    let summary = '';
    for await (const token of res) {
      summary += token;
    }
    return summary;
  }

  private async formatReviewResponse(review: readonly Review[], format?: string): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(review, null, 2);
      default:
      case 'markdown': {
        const completion = await this.completionService.complete([
          {
            role: 'system',
            content: `You are a software engineer tasked with creating documentation for a code review. The user will provide you with a list of issues as JSON, and your task is to write a markdown-formatted code review.

For each issue, include the following information:
- A name for the issue
- A description of the issue
- A recommendation for how to address the issue

Separate each issue with a horizontal rule.`,
          },
          {
            role: 'user',
            content: JSON.stringify(review, null, 2),
          },
        ]);
        let markdown = '';
        for await (const token of completion) {
          markdown += token;
        }
        return markdown;
      }
    }
  }

  async performReview(
    changeSummary: ChangeSummary,
    confidenceThreshold = 8.0,
    format?: string | undefined
  ): Promise<string> {
    const summary = await this.getChangeDescription(changeSummary.diff);
    console.log(summary);
    const reviewJobs = changeSummary.changes.flatMap(({ path, changedSymbols, content }) =>
      changedSymbols.map((symbol) => ({ path, content, symbol }))
    );

    console.log(`Starting ${reviewJobs.length} reviews`);
    let reviewsCompleted = 0;
    const startTime = Date.now();
    const reviews = await Promise.allSettled<IssueCompletion>(
      changeSummary.changes.flatMap(({ path, diffChunks, content }) =>
        diffChunks.map(async (chunk) => {
          console.log(`Starting review for ${path}`);
          return this.getIssueCompletion(summary, path, content, chunk).then((r) => {
            reviewsCompleted += 1;
            console.log(
              `Successfully completed review for ${path} (${reviewsCompleted}/${reviewJobs.length})`
            );
            return r;
          });
        })
      )
    );
    console.log(
      `Completed ${reviewsCompleted} reviews in ${Date.now() - startTime}ms with ${
        reviews.filter((r) => r.status === 'rejected').length
      } errors`
    );
    console.log(JSON.stringify(reviews, null, 2));

    console.log('Beginning validation of reviews');
    const validIssues = [];
    for (const review of reviews) {
      if (review.status === 'fulfilled') {
        for (const issue of review.value.issues) {
          if (issue.confidence < confidenceThreshold) {
            continue;
          }

          const result = await this.validateReviewResponse(
            issue,
            changeSummary.changes.find((c) => c.path === review.value.path)?.content ?? ''
          );
          const isValid = (result?.valid && result?.issue.needsAddressing) ?? false;
          console.log(JSON.stringify(result, null, 2));
          if (result) {
            console.log(result?.thoughts.map((t) => `  - ${t}`).join('\n'));
          }
          if (isValid) {
            validIssues.push({
              path: review.value.path,
              issue: {
                ...issue,
                description: result?.issue.description ?? issue.description,
                confidence: result?.issue.confidence ?? issue.confidence,
                severity: result?.issue.severity ?? issue.severity,
                impact: result?.issue.impact ?? issue.impact,
                classification: (result?.issue.classification ?? issue.classification).map((c) =>
                  c.toLowerCase()
                ),
              },
            });
          }
        }
      }
    }

    const finalResult = Object.entries(
      validIssues.reduce((acc, { path, issue }) => {
        if (acc[path]) {
          acc[path].issues.push(issue);
        } else {
          acc[path] = { path, issues: [issue] };
        }
        return acc;
      }, {} as Record<string, Review>)
    ).map(([path, review]) => ({ ...review, path }));

    return this.formatReviewResponse(finalResult, format);
  }
}
