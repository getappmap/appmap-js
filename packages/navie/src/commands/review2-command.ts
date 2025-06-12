import { warn } from 'console';
import z from 'zod';

import type { ReviewRpc } from '@appland/rpc';

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

const LABELS_PROMPT = `You are a helpful programming assistant. Analyze this git diff and suggest 
was in which the code can be labeled to facilitate analysis.

Only label code files written in the primary languages of the project. Do not label configuration
files, test files, or other supporting files such as setup and configuration scripts.

The list of labels, along with their effect on the code, is as follows:

* access.public - Indicates that a request allows public access, and does not require authentication or authorization.
  This label is intended for web request methods, e.g. controller functions, not for ordinary functions.
* audit - Writes an audit record, i.e. a permanent record of some application activity.
* command.perform - Indicates that an event represents the invocation of command-line command, such as a shell command or a script.
* crypto.decrypt - A function that performs decryption.
* crypto.digest - A function that computes a cryptographic digest (or 'hash') of some data.
* crypto.encrypt - A function that performs encryption.
* crypto.set_auth_data - A function that sets authenticated data for an encryption operation.
* dao.materialize - Loads data access objects from the database into memory. This function is intended
  applied to framework or library code, not to every instance of application code that loads data.
* deserialize.safe - Indicates that a function performs deserialization safely.
* deserialize.sanitize - Ensures that data is safe and trusted for deserialization, transforming it if
  necessary, and returning falsey or raising an exception if it's impossible to make the data safe.
* deserialize.unsafe - Indicates that a function does not guarantee safe deserialization.
* http.session.clear - Clears the HTTP session. Any previously issued session id becomes invalid.
* job.cancel - Cancels execution of a background job.
* job.create - Schedules a background job for execution.
* job.perform - Indicates that an event represents the invocation of a background job.
* log - Writes a message to the application log. This method is intended for framework or library code,
  not for every instance of application code that writes to the log.
* rpc.circuit_breaker - Indicates that a function provides circuit breaker functionality.
  When present, a circuit breaker function is expected to be invoked as a descendant of an RPC client request.
* secret - Indicates that a function returns a secret value. A secret is a user password, cryptographic key, authentication
  token, etc that is used for authentication or other verification.
  Personally-identifiable information (PII) does not fall under the scope of the secret label.
* security.authentication - A function that verifies the identity of an application user.
* security.authorization - A function that tests whether a user is authorized to perform an action.
* security.logout - A function that logs out a user.
* string.equals - Compares two strings for equality.
  The function receiver should be a string, and the function should take one argument that is the other string.
* system.exec - Indicates that a function performs an OS system command.
* system.exec.safe - Indicates that a function performs an OS system command in a manner which is known to be safe.
* system.exec.sanitize - Ensures that data is safe and trusted for use as a system command, transforming it if necessary, and returning falsey or raising an exception if it’s impossible to make the data safe.
  A function with this label can be used to convert untrusted data such as direct user input or HTTP request parameters into trusted data.
`;

const SUGGESTION_PROMPT = `Analyze this git diff and suggest specific, actionable changes
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

const SQL_PROMPT = `Analyze this git diff, related code context, and the SQL queries provided, and suggest specific, actionable changes that would
make the code better.

You should focus on the following areas:

* SQL vulnerabilities
* SQL performance improvements
* SQL style improvements

All suggestions that you make must be related to SQL queries or related use of the database.

Concentrate your analysis on the following potential weaknesses:

* N+1 queries / inefficient query patterns
* Unsanitized input used in SQL queries (SQL injection)
* Use of dynamic SQL without parameterization
* Improper input escaping in SQL queries
* Construction of queries using string concatenation
* Lack of least-privilege on database access
* Exposure of database error messages to users
* Hardcoded SQL credentials in source code
* Missing or improper handling of query timeouts
* Use of unbounded or unsanitized LIMIT/OFFSET values
* Blind trust in user-supplied table or column names
* Use of SELECT \* instead of explicit column selection
* Lack of auditing or logging on sensitive SQL operations
* Failure to use stored procedures or prepared statements
* Missing input validation on filter and sort parameters
* Improper handling of NULLs and unexpected data types
* Inadequate protection against second-order SQL injection
* Allowing multiple SQL statements in a single query
* Use of outdated or unsupported SQL drivers
* Uncontrolled access to database metadata (e.g., information\_schema)
* Poor error handling in batch SQL operations
`;

const HTTP_REQUEST_PROMPT = `Analyze this git diff, related code context, and the HTTP requests provided, and suggest specific, actionable changes that would
make the code better.

You should focus on the following areas:

* HTTP request vulnerabilities
* HTTP request performance improvements
* HTTP request style improvements

All suggestions that you make must be related to the application handling of HTTP requests, or related configuration.

Concentrate your analysis on the following potential weaknesses:

* Missing or improper input validation on HTTP parameters
* Lack of authentication or weak authentication mechanisms
* Insecure transport (e.g., HTTP used instead of HTTPS)
* Inadequate session management via cookies or headers
* Missing or incorrect content-type verification
* Insufficient CSRF protection
* Open redirects due to unchecked URL parameters
* Trusting user-supplied headers like Host or X-Forwarded-For
* Failure to sanitize user input used in query strings or path
* Verb tampering (e.g., improper handling of unexpected HTTP methods)
* Caching sensitive data in HTTP responses
* Information leakage via verbose error messages in HTTP responses
* Lack of rate limiting or throttling on endpoints
* Allowing overly permissive CORS configurations
* Improper parsing of multipart/form-data requests
* Missing security headers (e.g., Content-Security-Policy, X-Frame-Options)
* Improper use of HTTP status codes for error handling
* Deserialization of untrusted data from HTTP body
* Overly long or malformed headers not properly handled
* Insecure handling of file uploads via HTTP requests
`;

export const FeatureListItem = z.object({
  feature: z

    .string()
    .describe(
      'The name of the feature or functional change that has been made. This should be a short, descriptive name.'
    ),
});

export const FeatureList = z.object({
  features: FeatureListItem.array().describe(
    'A list of features or functional changes that have been made. Each feature should be a short, descriptive name.'
  ),
});

export const LabelItem = z.object({
  label: z
    .string()
    .describe(
      'The name of the label to be applied to the code. The label should be chosen from the list of labels.'
    ),
  description: z
    .string()
    .describe(
      'A description of why the label should be applied to the code. This should be a short, concise explanation.'
    ),
  file: z.string().describe('The name of the file that contains the function to be labeled.'),
  line: z
    .number()
    .describe(
      'The line number in the file where the function to be labeled is located. This should be a positive integer.'
    ),
});

export const LabelItemList = z.object({
  labels: LabelItem.array().describe(
    'A list of labels to be applied to the code. Each label should be a short, descriptive name.'
  ),
});

export const TestItem = z.object({
  file: z
    .string()

    .describe(`The name of the file that contains the test case.`),
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

export const FeatureTestItem = z.object({
  feature: z
    .string()
    .describe(
      `The name of the feature or functional change that has been made. This should be a short, descriptive name.`
    ),
  tests: z
    .array(TestItem.describe(`Detailed test case information.`))
    .describe('An array of test cases that pertain to the feature.'),
});

export const FeatureTestItemList = z
  .object({
    featureTests: FeatureTestItem.array().describe(
      'Each domain being reviewed should contain its own review domain object.'
    ),
  })
  .describe('A collection of feature tests for review purposes.');

export const SuggestionItem = z.object({
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

export const SuggestionList = z
  .object({
    suggestions: SuggestionItem.array().describe('A list of suggestions for code improvements.'),
  })
  .describe('A collection of suggestions for review purposes.');

const DEFAULT_DIFF_TERMS_THRESHOLD = 1000;

function jsonLine(obj: Partial<ReviewRpc.Review>) {
  return JSON.stringify(obj) + '\n';
}

function location(file: string, startLine?: number, endLine?: number): string {
  const locationTokens = [];
  if (startLine) locationTokens.push(startLine);
  if (endLine) locationTokens.push(endLine);
  return [file, locationTokens.join('-')].filter(Boolean).join(':');
}

function convertSuggestions(
  suggestions: z.infer<typeof SuggestionList>,
  category?: string
): ReviewRpc.Suggestion[] {
  return suggestions.suggestions.map((suggestion) => ({
    ...suggestion,
    id: randomUUID(),
    location: location(suggestion.file, suggestion.line),
    code: suggestion.context,
    title: suggestion.label,
    category: category ?? suggestion.type,
  }));
}

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
    const analyzeFeatures = request.userOptions.booleanValue('features', true);
    const analyzeLabels = request.userOptions.booleanValue('labels', true);
    const analyzeSuggestions = request.userOptions.booleanValue('suggestions', true);
    const sqlSuggestions = request.userOptions.booleanValue('sql', true);
    const httpSuggestions = request.userOptions.booleanValue('http', true);
    const outputJson = request.userOptions.stringValue('format', 'text') === 'json';
    const outputJsonLines = request.userOptions.stringValue('format', 'text') === 'jsonl';
    const outputText = !outputJson && !outputJsonLines;
    const runTests = request.userOptions.stringValue('runtests');
    const runTestsImmediately = runTests === 'immediate';
    const baseBranch = request.userOptions.stringValue('base');
    const testGenGather = request.userOptions.booleanValue('testgengather', true);

    let featureList: string[] | undefined;
    let testMatrix: z.infer<typeof FeatureTestItemList> | undefined;
    let suggestionList: z.infer<typeof SuggestionList> | undefined;
    let labelItemList: z.infer<typeof LabelItemList> | undefined;
    let sqlSuggestionList: z.infer<typeof SuggestionList> | undefined;
    let httpSuggestionList: z.infer<typeof SuggestionList> | undefined;

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

    if (analyzeFeatures) {
      featureList = await this.listFeatures(vectorTerms, request, gitDiff);

      if (outputText) {
        yield '## Feature List\n';
        for (const feature of featureList) {
          yield `* ${feature}\n`;
        }
      }

      if (outputJsonLines) {
        yield jsonLine({ features: featureList.map((f) => ({ description: f })) });
      }
      yield '\n\n';

      testMatrix = await this.buildTestMatrix(vectorTerms, featureList, gitDiff);

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

      if (outputJsonLines) {
        yield jsonLine({
          features: testMatrix.featureTests.map((feature) => {
            const result: ReviewRpc.Feature = {
              description: feature.feature,
            };
            const [test] = feature.tests;
            if (test) {
              result.testDetails = {
                file: test.file,
                location: location(test.file, test.startLine, test.endLine),
                tests: [{ name: test.testName }],
              };
              result.hasCoverage = true;
            } else {
              result.hasCoverage = false;
              result.aiPrompt = `@test ${feature.feature}`;
            }
            return result;
          }),
        });
      }

      if (outputText) {
        yield '## Behavioral Analysis\n';
        yield 'When test coverage is available for code change, AppMap can use the runtime data generated from ';
        yield 'running the tests to help improve the accuracy and completeness of the analysis.\n\n';
        yield '| Feature | Related Tests |\n';
        yield '|---------|---------------|\n';
        for (const feature of testMatrix.featureTests) {
          const featureTestDescription = (testItem: z.infer<typeof TestItem>): string => {
            const { file, startLine, endLine, testName } = testItem;

            return [location(file, startLine, endLine), `(${testName})`].join(' ');
          };

          const testList =
            feature.tests.length > 0
              ? feature.tests.map(featureTestDescription).join('<br>')
              : 'No tests';
          yield `| ${feature.feature} | ${testList} |\n`;
        }

        // Add test suggestions for features without tests
        yield '\n### Suggested Test Commands\n\n';
        if (testMatrix.featureTests.find((feature) => feature.tests.length === 0)) {
          yield 'Copy and paste these commands to Navie AI to generate new test cases:\n\n';
          for (const feature of testMatrix.featureTests) {
            if (feature.tests.length === 0) {
              const commandArguments = ['@test', '/diff'];
              if (baseBranch) commandArguments.push(`/base=${baseBranch}`);
              if (!testGenGather) commandArguments.push('/nogather');
              commandArguments.push(feature.feature);
              yield `\n* \`${commandArguments.join(' ')}\`\n`;
            }
          }
        } else yield 'No new test cases are needed for the features that were identified.\n';
      }
      yield '\n\n';
    }

    if (analyzeLabels) {
      labelItemList = await this.listLabels(vectorTerms, gitDiff);

      if (labelItemList && outputText && labelItemList.labels.length > 0) {
        yield '## Suggested Labels\n\n';
        yield 'Copy and paste these labels into the code to help with analysis:\n\n';
        for (const labelItem of labelItemList.labels)
          yield`* **${labelItem.label}** (${labelItem.file}:${labelItem.line}) — ${labelItem.description}\n`;
      }
    }

    if (runTests && testMatrix && featureList) {
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

    const allSuggestions: ReviewRpc.Suggestion[] = [];
    if (analyzeSuggestions) {
      suggestionList = await this.listSuggestions(gitDiff);
      if (outputText && suggestionList.suggestions.length > 0) {
        yield '## Suggestions\n\n';
        yield generateSuggestionsMarkdown(suggestionList.suggestions);
        yield '\n\n';
      }
      allSuggestions.push(...convertSuggestions(suggestionList));
      if (outputJsonLines) {
        yield jsonLine({ suggestions: allSuggestions });
      }
    }

    if (sqlSuggestions) {
      const sqlSuggestionList = await this.listSQLSuggestions(vectorTerms, gitDiff);
      if (outputText && sqlSuggestionList.suggestions.length > 0) {
        yield '## SQL Suggestions\n\n';
        yield generateSuggestionsMarkdown(sqlSuggestionList.suggestions);
        yield '\n\n';
      }
      allSuggestions.push(...convertSuggestions(sqlSuggestionList, 'sql'));
      if (outputJsonLines) {
        yield jsonLine({ suggestions: allSuggestions });
      }
    }

    if (httpSuggestions) {
      const httpSuggestionList = await this.listHTTPSuggestions(vectorTerms, gitDiff);
      if (outputText && httpSuggestionList.suggestions.length > 0) {
        yield '## HTTP Suggestions\n\n';
        yield generateSuggestionsMarkdown(httpSuggestionList.suggestions);
        yield '\n\n';
      }
      allSuggestions.push(...convertSuggestions(httpSuggestionList, 'http'));
      if (outputJsonLines) {
        yield jsonLine({ suggestions: allSuggestions });
      }
    }

    if (outputJson) {
      yield JSON.stringify({
        labels: labelItemList,
        features: featureList,
        testMatrix: testMatrix,
        suggestions: suggestionList,
        sqlSuggestions: sqlSuggestionList,
        httpSuggestions: httpSuggestionList,
      });
    }
  }

  private async listLabels(
    vectorTerms: string[],
    gitDiff: UserContext.CodeSnippetItem
  ): Promise<z.infer<typeof LabelItemList> | undefined> {
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
        content: LABELS_PROMPT,
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

    const labelItemList = await this.completionService.json(messages, LabelItemList, {
      temperature: 0.0,
    });

    return labelItemList;
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
        content: 'You are a helpful programming assistant that is an expert on code review.',
      },
      {
        role: 'user',
        content: `Here is a diff of the current code work in progress:
  <diff>
  ${gitDiff.content}
  </diff>`,
      },
      {
        role: 'user',
        content: SUGGESTION_PROMPT,
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

  private async listSQLSuggestions(
    vectorTerms: string[],
    gitDiff: UserContext.CodeSnippetItem
  ): Promise<z.infer<typeof SuggestionList>> {
    const terms = [...vectorTerms, 'sql', 'database', 'query'];

    const context = await this.lookupContextService.lookupContext(terms, this.options.tokenLimit);

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
        content:
          'You are a helpful programming assistant that is an expert on SQL security, performance, and style considerations.',
      },
      {
        role: 'user',
        content: `Here is a diff of the current code work in progress:
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
      {
        role: 'user',
        content: SQL_PROMPT,
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

  private async listHTTPSuggestions(
    vectorTerms: string[],
    gitDiff: UserContext.CodeSnippetItem
  ): Promise<z.infer<typeof SuggestionList>> {
    const terms = [...vectorTerms, 'http', 'request', 'response', 'api', 'web'];

    const context = await this.lookupContextService.lookupContext(terms, this.options.tokenLimit);

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
        content:
          'You are a helpful programming assistant that is an expert on HTTP request security, performance, and style considerations.',
      },
      {
        role: 'user',
        content: `Here is a diff of the current code work in progress:
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
      {
        role: 'user',
        content: HTTP_REQUEST_PROMPT,
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

function generateSuggestionsMarkdown(suggestions: z.infer<typeof SuggestionItem>[]): string {
  return suggestions
    .sort(comparePriorities)
    .map((suggestion) => {
      const emoji = priorityEmoji(suggestion.priority);
      const location = [suggestion.file, suggestion.line].filter(Boolean).join(':');
      return [
        `### ${emoji} ${suggestion.label} (${suggestion.type}, ${suggestion.priority} priority)`,
        '',
        `${suggestion.description}`,
        '```\n',
        `<!-- file: ${location} -->`,
        suggestion.context,
        '```',
      ].join('\n');
    })
    .join('\n\n');
}

function comparePriorities(
  a: z.infer<typeof SuggestionItem>,
  b: z.infer<typeof SuggestionItem>
): number {
  const priorityOrder = ['low', 'medium', 'high'];
  return priorityOrder.indexOf(b.priority) - priorityOrder.indexOf(a.priority);
}

function priorityEmoji(priority: z.infer<typeof SuggestionItem>['priority']): string {
  switch (priority) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🔵';
    default:
      return '';
  }
}
