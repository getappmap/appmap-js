import { warn } from 'console';
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
import { TestInvocationItem, TestInvocationRequest } from '../test-invocation';
import { randomUUID } from 'crypto';
import InvokeTestsService from '../services/invoke-tests-service';
import resolveTestItems from '../lib/resolve-test-items';
import ProjectInfoService from '../services/project-info-service';

const ENUMERATE_FEATURES_PROMPT = `Inspect the diff, enumerate the features and functional changes that have been made, and assign a name to each one.

Don't treat changes to testing as features or functional changes. Only describe changes to application code.

Respond with a list of features with one feature per line. Each feature should start with an asterisk (*) bullet point
indicator.

Be specific and complete with the name of each feature or functional change. Each line that you emit should be enough
for a reader to get a complete understanding of the feature or functional change, without having to refer to the code or 
to other background information or to the diff itself.

The feature or change should be a declarative statement that describes what the feature is or what the change is.
It should not be phrased like a TODO item or a question, it should be a statement of of what the feature is or what the change is.
For example, instead of saying "Add a new feature to the application", you should say "Added a new feature to the application that allows users to do X".
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

export const TestItem = z.object({
  file: z
    .string()

    .describe(
      `The name of the file that contains the test case. This should be a short, descriptive name.`
    ),
  startLine: z
    .number()
    .describe(
      `The line number in the file where the test case starts. This should be a positive integer.`
    )
    .optional(),
  endLine: z
    .number()
    .describe(
      `The line number in the file where the test case ends. This should be a positive integer.`
    )
    .optional(),
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
  context: z.string().describe('A snippet of code that provides the context for the suggestion.'),
  priority: z.enum(['low', 'medium', 'high']).describe('Priority of the suggestion.'),
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
    private readonly projectInfoService: ProjectInfoService,
    private readonly completionService: CompletionService,
    private readonly lookupContextService: LookupContextService,
    private readonly vectorTermsService: VectorTermsService,
    private readonly invokeTestsService: InvokeTestsService
  ) {}

  async *execute(request: CommandRequest, chatHistory?: ChatHistory): AsyncIterable<string> {
    const diffTermsThreshold =
      request.userOptions.numberValue('diff-terms-threshold') ?? DEFAULT_DIFF_TERMS_THRESHOLD;
    const outputJson = request.userOptions.stringValue('format', 'text') === 'json';
    const outputText = !outputJson;
    const runTests = request.userOptions.stringValue('runtests');
    const runTestsImmediately = runTests === 'immediate';
    const baseBranch = request.userOptions.stringValue('base');
    const testGenGather = request.userOptions.booleanValue('testgengather', true);

    if (!hasCodeSelectionArray(request)) {
      if (outputText) yield 'No code selection was provided.';
      return;
    }

    const projectInfo = await this.projectInfoService.lookupProjectInfo();

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

    const testMatrix = await this.buildTestMatrix(vectorTerms, featureList, gitDiff);

    // Filter test matrix suggested tests to include only those that exist in the file system
    for (const featureTest of testMatrix.featureTests) {
      if (featureTest.tests.length === 0) continue;

      const suggestedTestItems = featureTest.tests;
      // NOTE A single, global selectExistingTestItems call could be used instead of calling
      // within this loop, but the logic would be complicated somewhat.
      const existingTestItems = await resolveTestItems(
        this.lookupContextService,
        projectInfo,
        suggestedTestItems
      );

      if (existingTestItems.length !== suggestedTestItems.length) {
        warn(
          `Some suggested test items do not exist in the file system. ${existingTestItems.length} of ${suggestedTestItems.length} test items exist.`
        );
      }

      featureTest.tests = existingTestItems;
    }

    if (outputText) {
      yield '## Test Analysis\n\n';
      yield '| Feature | Test Coverage |\n';
      yield '|---------|---------------|\n';
      for (const feature of testMatrix.featureTests) {
        const featureTestDescription = (testItem: z.infer<typeof TestItem>): string => {
          const { file, startLine, endLine, testName } = testItem;
          const locationTokens = [];
          if (startLine) locationTokens.push(startLine);
          if (endLine) locationTokens.push(endLine);

          return [[file, locationTokens.join('-')].filter(Boolean).join(':'), `(${testName})`].join(
            ' '
          );
        };

        const testList =
          feature.tests.length > 0
            ? feature.tests.map(featureTestDescription).join('<br>')
            : 'No tests';
        yield `| ${feature.feature} | ${testList} |\n`;
      }

      // Add test suggestions for features without tests
      yield '\n### Suggested Test Commands\n\n';
      yield 'Copy and paste these commands to Navie AI to generate new test cases:\n\n';
      for (const feature of testMatrix.featureTests) {
        if (feature.tests.length === 0) {
          const commandArguments = ['@test', '/diff'];
          if (baseBranch) commandArguments.push(`/base=${baseBranch}`);
          if (!testGenGather) commandArguments.push('/nogather');
          commandArguments.push(feature.feature);

          yield '\n';
          yield '```';
          yield '\n';
          yield commandArguments.join(' ');
          yield '\n';
          yield '```';
          yield '\n\n';
        }
      }
    }
    yield '\n\n';

    if (runTests) {
      // Invoke tests that exist in the test matrix
      const testItems: TestInvocationItem[] = [];
      for (const feature of testMatrix.featureTests) {
        if (feature.tests.length > 0) {
          for (const test of feature.tests) {
            const testId = randomUUID();
            testItems.push({
              id: testId,
              filePath: test.file,
              startLine: test.startLine,
              endLine: test.endLine,
              testName: test.testName,
            });
          }
        }
      }

      const testInvocationRequest: TestInvocationRequest = {
        testItems: testItems,
        invocation: runTestsImmediately ? 'sync' : 'async',
      };
      const invocationPromise = this.invokeTestsService.invokeTests(testInvocationRequest);
      if (runTestsImmediately) {
        await invocationPromise;
      }
    }

    const suggestions = await this.listSuggestions(gitDiff);
    if (outputText) {
      yield '## Suggestions\n\n';
      for (const suggestion of suggestions.suggestions) {
        yield `**${suggestion.label} (${suggestion.type})**\n`;
        yield '\n';
        yield `${suggestion.description}\n`;
        yield '\n';
        yield `| Field | Value |\n`;
        yield `|-------|-------|\n`;
        yield `| Type | ${suggestion.type} |\n`;
        yield `| Priority | ${suggestion.priority} |\n`;
        yield `| Location | [${suggestion.file}:${suggestion.line}](${suggestion.file}#${suggestion.line}) |\n`;
        yield '\n';
        yield '```';
        yield '\n';
        yield suggestion.context;
        yield '\n';
        yield '```';
        yield '\n\n';
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
    featureList: string[],
    gitDiff: UserContext.CodeSnippetItem
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
        content: `Here is the diff:
  <diff>
  ${gitDiff.content}
  </diff>
  `,
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
