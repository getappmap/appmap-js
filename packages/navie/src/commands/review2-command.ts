import z from 'zod';
import Command, { CommandRequest, hasCodeSelectionArray } from '../command';
import { ExplainOptions } from './explain-command';
import CompletionService from '../services/completion-service';
import LookupContextService from '../services/lookup-context-service';
import VectorTermsService from '../services/vector-terms-service';
import { ChatHistory } from '../navie';
import { UserContext } from '../user-context';
import { getGitDiff, getPinnedItemsExceptGitDiff, GitDiffError } from '../lib/git-diff';
import { ContextV2 } from '../context';
import Message from '../message';

const ENUMERATE_FEATURES_PROMPT = `Inspect the diff, enumerate the features and functional changes that have been made, and assign a name to each one.

Don't treat changes to testing as features or functional changes. Only describe changes to application code.

Respond with a list of features with one feature per line. Each feature should start with an asterisk (*) bullet point
indicator.

Be specific and complete with the name of each feature or functional change. Each line that you emit should be enough
for a reader to get a complete understanding of the feature or functional change, without having to refer to the code or 
to other background information or to the diff itself.
`;

const TEST_MATRIX_PROMPT = `Search the codebase to determine which, if any, tests exist for each of
the following listed features. For each feature, return a list of the test cases that pertain to the feature.

<features>
{feature_list}
</features>

Respond with a JSON object containing a feature_tests key, which is a list.

Each entry in the list should be a dictionary with two keys:
- feature: The name of the feature
- tests: A list of test cases that pertain to the feature

The JSON object should look like this:
{
    "feature_tests": [
        {
            "feature": "Feature 1",
            "tests": ["tests/test_feature_1.py::test_name_1", "tests/test_feature_1.py::test_name_2"]
        },
        {
            "feature": "Feature 2",
            "tests": ["tests/test_feature_2.py::test_name_3"]
        }
    ]
}
"""`;

const SUGGESTION_PROMPT = `You are a helpful programming assistant. Analyze this git diff and suggest specific, actionable changes
that would make the code better.

Your suggestions should focus on the following areas:

1) Potential bugs or errors in the code.
2) Security vulnerabilities.
3) Performance improvements.

Other types suggestions, such as:

* Code style
* Refactoring
* Documentation
* Testing
* Extensive error handling
* Code organization
* Code formatting
* Code readability
* Code complexity

are generally _not_ desirable. However, in the rare case that this type of suggestion can make a large improvement to the code, you may include it.

Don't suggest changes that have already been considered by the developer and are explained in the comments.

Respect implementation decisions that are explained in comments, including both current choices and future plans that are explicitly deferred.

Don't suggest switching the implementation of some code back to the way that it previously was.`;

const FeatureListItem = z.object({
  feature: z

    .string()
    .describe(
      'The name of the feature or functional change that has been made. This should be a short, descriptive name.'
    ),
});

const FeatureList = z.object({
  features: FeatureListItem.array().describe(
    'A list of features or functional changes that have been made. Each feature should be a short, descriptive name.'
  ),
});

const TestItem = z.object({
  file: z
    .string()

    .describe(
      `The name of the file that contains the test case. This should be a short, descriptive name.`
    ),
  startLine: z
    .number()
    .describe(
      `The line number in the file where the test case starts. This should be a positive integer.`
    ),
  endLine: z
    .number()
    .describe(
      `The line number in the file where the test case ends. This should be a positive integer.`
    ),
  testName: z.string().describe(`The name of the test case within the test file.`),
});

const FeatureTestItem = z.object({
  feature: z
    .string()
    .describe(
      `The name of the feature or functional change that has been made. This should be a short, descriptive name.`
    ),
  tests: z
    .array(TestItem.describe(`Detailed test case information.`))
    .describe('An array of test cases that pertain to the feature.'),
});

const FeatureTestItemList = z
  .object({
    featureTests: FeatureTestItem.array().describe(
      'Each domain being reviewed should contain its own review domain object.'
    ),
  })
  .describe('A collection of feature tests for review purposes.');

const SuggestionItem = z.object({
  file: z.string().describe('The path to the file from the project root.'),
  line: z.number().describe('Line number in the file where the suggestion applies.'),
  type: z
    .string()
    .describe(
      'The type of code improvement that the suggestion suggests. Primary suggestion types are: bug, security, performance.'
    ),
  cwe: z.string().describe('The Common Weakness Enumeration identifier related to the suggestion.'),
  context: z.string().describe('A snippet of code that provides the context for the suggestion.'),
  severity: z.enum(['low', 'medium', 'high']).describe('Severity of the suggestion.'),
  label: z.string().describe('A few words that concisely describe the suggestion.'),
  description: z
    .string()
    .describe('A sentence that explains the suggestion and how it would improve the code.'),
});

const SuggestionList = z
  .object({
    suggestions: SuggestionItem.array().describe('A list of suggestions for code improvements.'),
  })
  .describe('A collection of suggestions for review purposes.');

const DEFAULT_DIFF_TERMS_THRESHOLD = 1000;

export default class Review2Command implements Command {
  constructor(
    private readonly options: ExplainOptions,
    private readonly completionService: CompletionService,
    private readonly lookupContextService: LookupContextService,
    private readonly vectorTermsService: VectorTermsService
  ) {}

  async *execute(request: CommandRequest, chatHistory?: ChatHistory): AsyncIterable<string> {
    const diffTermsThreshold =
      request.userOptions.numberValue('diff-terms-threshold') ?? DEFAULT_DIFF_TERMS_THRESHOLD;
    const outputJson = request.userOptions.stringValue('format', 'text') === 'json';
    const outputText = !outputJson;

    if (!hasCodeSelectionArray(request)) {
      if (outputText) yield 'No code selection was provided.';
      return;
    }

    let gitDiff: UserContext.CodeSnippetItem;
    try {
      gitDiff = getGitDiff(request);
    } catch (e) {
      if (e instanceof GitDiffError) {
        if (outputText) yield e.message;
      } else {
        throw e;
      }
      return;
    }

    const verbose = request.userOptions.booleanValue('verbose', false);
    if (verbose && outputText) {
      yield '```diff\n';
      yield gitDiff.content;
      yield '\n```\n';
    }

    let vectorTerms = gitDiff.content.split(/\s+/).filter((term) => term.length >= 3);
    if (vectorTerms.length > diffTermsThreshold) {
      vectorTerms = await this.vectorTermsService.suggestTerms(
        [gitDiff.content, request.question].join('\n')
      );
    }

    const featureList = await this.listFeatures(vectorTerms, request, gitDiff);

    if (outputText) {
      yield '## Feature List\n\n';
      for (const feature of featureList) {
        yield ` * ${feature}\n`;
      }
    }
    yield '\n\n';

    const testMatrix = await this.buildTestMatrix(vectorTerms, featureList);
    if (outputText) {
      yield '## Test Analysis\n\n';
      yield '| Feature | Test Coverage |\n';
      yield '|---------|---------------|\n';
      for (const feature of testMatrix.featureTests) {
        const testList =
          feature.tests.length > 0
            ? feature.tests
                .map((test) => `${test.file}:${test.startLine}-${test.endLine} (${test.testName})`)
                .join('<br>')
            : 'No tests';
        yield `| ${feature.feature} | ${testList} |\n`;
      }

      // Add test suggestions for features without tests
      yield '\n### Suggested Test Commands\n\n';
      yield 'Copy and paste these commands to Navie AI to generate new test cases:\n\n';
      for (const feature of testMatrix.featureTests) {
        if (feature.tests.length === 0) {
          yield '\n';
          yield '```';
          yield '\n';
          yield `@test ${feature.feature}\n`;
          yield '```';
          yield '\n\n';
        }
      }
    }
    yield '\n\n';

    const suggestions = await this.listSuggestions(gitDiff);
    if (outputText) {
      yield '## Suggestions\n\n';
      for (const suggestion of suggestions.suggestions) {
        const { cwe: cweWithPossibleCWEPrefix } = suggestion;
        let cwe = cweWithPossibleCWEPrefix;
        if (cweWithPossibleCWEPrefix.startsWith('CWE-')) {
          cwe = cweWithPossibleCWEPrefix.substring('CWE-'.length);
        }

        yield `**${suggestion.label} (${suggestion.type})**\n`;
        yield '\n';
        yield `${suggestion.description}\n`;
        yield '\n';
        yield `| Field | Value |\n`;
        yield `|-------|-------|\n`;
        yield `| CWE | [${suggestion.cwe}](https://cwe.mitre.org/data/definitions/${cwe}.html) |\n`;
        yield `| Type | ${suggestion.type} |\n`;
        yield `| Severity | ${suggestion.severity} |\n`;
        yield `| Location | [${suggestion.file}:${suggestion.line}](${suggestion.file}:${suggestion.line}) |\n`;
        yield '\n';
        yield '```';
        yield '\n';
        yield suggestion.context;
        yield '\n';
        yield '```';
        yield '\n';
      }
    }

    if (outputJson) {
      yield JSON.stringify({
        features: featureList,
        testMatrix: testMatrix,
        suggestions: suggestions,
      });
    }
  }

  /**
   * This function is responsible for context lookups and providing generation of the initial
   * review analysis.
   * @param req The command request.
   * @param gitDiff The git diff to be reviewed.
   * @returns The review analysis generator, yielding tokens as they are generated and the messages
   *          that were sent to the LLM.
   */
  private async listFeatures(
    vectorTerms: string[],
    req: CommandRequest & { codeSelection: UserContext.ContextItem[] },
    gitDiff: UserContext.CodeSnippetItem
  ): Promise<string[]> {
    const pinnedItems = await getPinnedItemsExceptGitDiff(
      this.options,
      this.lookupContextService,
      req.codeSelection,
      gitDiff
    );

    const context = await this.lookupContextService.lookupContext(
      vectorTerms,
      this.options.tokenLimit
    );

    const contextMessage = context
      .map((item) =>
        ContextV2.isFileContextItem(item)
          ? `<${item.type} location="${item.location}">\n${item.content}\n</${item.type}>`
          : `<${item.type}>\n${item.content}\n</${item.type}>`
      )
      .join('\n');

    const messages: Message[] = [
      {
        role: 'system',
        content: ENUMERATE_FEATURES_PROMPT,
      },
      {
        role: 'user',
        content: `Here is the diff:
  <diff>
  ${gitDiff.content}
  </diff>`,
      },
      {
        role: 'user',
        content: `Here is some related context from the project, which you can use to help you understand the changes:
  <context>
  ${contextMessage}
  </context>`,
      },
    ];

    if (pinnedItems.length > 0) {
      const pinnedItemsMessage = pinnedItems
        .map((cs) =>
          ContextV2.isFileContextItem(cs)
            ? `<${cs.type} location="${cs.location}">\n${cs.content}\n</${cs.type}>`
            : `<${cs.type}>\n${cs.content}\n</${cs.type}>`
        )
        .filter(Boolean)
        .join('\n\n');

      messages.push({
        role: 'user',
        content: `Here are some additional code snippets that may be relevant to the review:
  <pinnedItems>
  ${pinnedItemsMessage}
  </pinnedItems>`,
      });
    }

    const features = await this.completionService.json(messages, FeatureList, {
      temperature: 0.0,
    });

    return features?.features.map((feature) => feature.feature) ?? [];
  }

  private async buildTestMatrix(
    vectorTerms: string[],
    featureList: string[]
  ): Promise<z.infer<typeof FeatureTestItemList>> {
    const context = await this.lookupContextService.lookupContext(
      vectorTerms,
      this.options.tokenLimit,
      {
        include: ['test', 'spec'],
      }
    );

    const contextMessage = context
      .map((item) =>
        ContextV2.isFileContextItem(item)
          ? `<${item.type} location="${item.location}">\n${item.content}\n</${item.type}>`
          : `<${item.type}>\n${item.content}\n</${item.type}>`
      )
      .join('\n');

    const messages: Message[] = [
      {
        role: 'system',
        content: TEST_MATRIX_PROMPT,
      },
      {
        role: 'user',
        content: `Here are the features that have been identified:
  <features>
  ${featureList.map((feature) => `* ${feature}`).join('\n')}
  </features>`,
      },
      {
        role: 'user',
        content: `Here are test cases and other content related to tests, which you can correlate with the features:
  <context>
  ${contextMessage}
  </context>`,
      },
    ];
    const featureMatrix = await this.completionService.json(messages, FeatureTestItemList, {
      temperature: 0.0,
    });

    if (!featureMatrix) {
      console.warn('No feature matrix found');
    }

    return (
      featureMatrix ?? {
        featureTests: [],
      }
    );
  }

  private async listSuggestions(
    gitDiff: UserContext.CodeSnippetItem
  ): Promise<z.infer<typeof SuggestionList>> {
    const messages: Message[] = [
      {
        role: 'system',
        content: SUGGESTION_PROMPT,
      },
      {
        role: 'user',
        content: `Here is the diff:
  <diff>
  ${gitDiff.content}
  </diff>`,
      },
    ];

    const suggestions = await this.completionService.json(messages, SuggestionList, {
      temperature: 0.0,
    });
    if (!suggestions) {
      console.warn('No suggestions found');
    }
    return (
      suggestions ?? {
        suggestions: [],
      }
    );
  }
}
