import Review2Command, {
  FeatureList,
  FeatureTestItemList,
  LabelItemList,
  SuggestionList,
} from '../../src/commands/review2-command';
import { ExplainOptions } from '../../src/commands/explain-command';
import CompletionService from '../../src/services/completion-service';
import LookupContextService from '../../src/services/lookup-context-service';
import VectorTermsService from '../../src/services/vector-terms-service';
import { UserOptions } from '../../src/lib/parse-options';
import InvokeTestsService from '../../src/services/invoke-tests-service';
import ProjectInfoService from '../../src/services/project-info-service';
import { ProjectInfo } from '../../src/project-info';
import resolveTestItems from '../../src/lib/resolve-test-items';
import z from 'zod';

jest.mock('../../src/lib/resolve-test-items', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Review2Command', () => {
  let command: Review2Command;
  let projectInfoService: jest.Mocked<ProjectInfoService>;
  let completionService: jest.Mocked<CompletionService>;
  let lookupContextService: jest.Mocked<LookupContextService>;
  let vectorTermsService: jest.Mocked<VectorTermsService>;
  let testInvocationService: jest.Mocked<InvokeTestsService>;
  let resolveTestItemsMock: jest.Mock;
  const projectInfos: ProjectInfo[] = [
    {
      directory: '/test/project-1',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    resolveTestItemsMock = resolveTestItems as jest.Mock;
    resolveTestItemsMock.mockImplementation((lookupContextService, projectInfo, testItems) => {
      return Promise.resolve(testItems);
    });

    projectInfoService = {
      lookupProjectInfo: jest.fn().mockResolvedValue(projectInfos),
    } as unknown as jest.Mocked<ProjectInfoService>;

    completionService = {
      complete: jest.fn(),
      json: jest.fn(),
    } as unknown as jest.Mocked<CompletionService>;

    lookupContextService = {
      lookupContext: jest
        .fn()
        .mockResolvedValue([
          { type: 'code-snippet', content: 'test context', location: 'test.ts' },
        ]),
    } as unknown as jest.Mocked<LookupContextService>;

    vectorTermsService = {
      suggestTerms: jest.fn().mockResolvedValue(['test', 'terms']),
    } as unknown as jest.Mocked<VectorTermsService>;

    testInvocationService = {
      invokeTests: jest.fn(),
    } as unknown as jest.Mocked<InvokeTestsService>;

    command = new Review2Command(
      { tokenLimit: 1000 } as ExplainOptions,
      projectInfoService,
      completionService,
      lookupContextService,
      vectorTermsService,
      testInvocationService
    );
  });

  class ReviewCommandOptions {
    userOptions: UserOptions = new UserOptions(new Map());

    mockFeatures: z.infer<typeof FeatureList> = {
      features: [],
    };

    mockTestMatrix: z.infer<typeof FeatureTestItemList> = {
      featureTests: [],
    };

    mockLabels: z.infer<typeof LabelItemList> = {
      labels: [],
    };

    mockSuggestions: z.infer<typeof SuggestionList> = {
      suggestions: [],
    };

    mockSQLSuggestions: z.infer<typeof SuggestionList> = {
      suggestions: [],
    };

    mockHTTPSuggestions: z.infer<typeof SuggestionList> = {
      suggestions: [],
    };
  }

  async function executeReviewCommandWithMocks(
    command: Review2Command,
    options: ReviewCommandOptions
  ): Promise<string> {
    // TODO: Use a better strategy to mock the completion service that doesn't depend on the order of calls
    completionService.json
      .mockResolvedValueOnce(options.mockFeatures)
      .mockResolvedValueOnce(options.mockTestMatrix)
      .mockResolvedValueOnce(options.mockLabels)
      .mockResolvedValueOnce(options.mockSuggestions)
      .mockResolvedValueOnce(options.mockSQLSuggestions)
      .mockResolvedValueOnce(options.mockHTTPSuggestions);

    const output = command.execute({
      question: 'review',
      userOptions: options.userOptions,
      codeSelection: [
        {
          type: 'code-snippet',
          location: 'git diff',
          content: 'test diff content',
        },
      ],
    });

    const tokens = [];
    for await (const token of output) {
      tokens.push(token);
    }
    return tokens.join('');
  }

  describe('test suggestions', () => {
    it('should generate @test commands for features without tests', async () => {
      const reviewCommandOptions = new ReviewCommandOptions();
      reviewCommandOptions.mockFeatures = {
        features: [{ feature: 'Feature 1' }, { feature: 'Feature 2' }],
      };
      reviewCommandOptions.mockTestMatrix = {
        featureTests: [
          {
            feature: 'Feature 1',
            tests: [
              {
                file: 'test/feature1.spec.ts',
                startLine: 10,
                endLine: 20,
                testName: 'should do feature 1',
              },
            ],
          },
          {
            feature: 'Feature 2',
            tests: [], // No tests for Feature 2
          },
          {
            feature: 'Feature 3',
            tests: [], // No tests for Feature 3
          },
        ],
      };

      const result = await executeReviewCommandWithMocks(command, reviewCommandOptions);

      expect(result).toContain('### Suggested Test Commands');
      expect(result).toContain('@test /diff Feature 2');
      expect(result).toContain('@test /diff Feature 3');
      expect(result).not.toContain('@test Feature 1');
    });

    it('should include base branch in @test commands when specified', async () => {
      const reviewCommandOptions = new ReviewCommandOptions();
      reviewCommandOptions.mockFeatures = {
        features: [{ feature: 'Feature 1' }, { feature: 'Feature 2' }],
      };
      reviewCommandOptions.mockTestMatrix = {
        featureTests: [
          {
            feature: 'Feature 1',
            tests: [], // No tests for Feature 1
          },
          {
            feature: 'Feature 2',
            tests: [], // No tests for Feature 2
          },
        ],
      };

      reviewCommandOptions.userOptions = new UserOptions(new Map([['base', 'main']]));

      const result = await executeReviewCommandWithMocks(command, reviewCommandOptions);

      expect(result).toContain('### Suggested Test Commands');
      expect(result).toContain('@test /diff /base=main Feature 1');
      expect(result).toContain('@test /diff /base=main Feature 2');
    });

    it('should include /nogather flag when testgengather is disabled', async () => {
      const reviewCommandOptions = new ReviewCommandOptions();
      reviewCommandOptions.mockFeatures = {
        features: [{ feature: 'Feature 1' }],
      };
      reviewCommandOptions.mockTestMatrix = {
        featureTests: [
          {
            feature: 'Feature 1',
            tests: [], // No tests for Feature 1
          },
        ],
      };
      reviewCommandOptions.userOptions = new UserOptions(new Map([['testgengather', false]]));

      const result = await executeReviewCommandWithMocks(command, reviewCommandOptions);

      expect(result).toContain('### Suggested Test Commands');
      expect(result).toContain('@test /diff /nogather Feature 1');
    });

    it('should not include /nogather flag by default', async () => {
      const reviewCommandOptions = new ReviewCommandOptions();
      reviewCommandOptions.mockFeatures = {
        features: [{ feature: 'Feature 1' }],
      };
      reviewCommandOptions.mockTestMatrix = {
        featureTests: [
          {
            feature: 'Feature 1',
            tests: [], // No tests for Feature 1
          },
        ],
      };

      const result = await executeReviewCommandWithMocks(command, reviewCommandOptions);

      expect(result).toContain('### Suggested Test Commands');
      expect(result).toContain('@test /diff Feature 1');
      expect(result).not.toContain('/nogather');
    });
  });

  describe('areas of review', () => {
    it('includes label suggestions in the output', async () => {
      const reviewCommandOptions = new ReviewCommandOptions();
      reviewCommandOptions.mockFeatures = {
        features: [{ feature: 'Feature 1' }],
      };
      reviewCommandOptions.mockLabels = {
        labels: [
          {
            label: 'label1',
            description: 'Description for label1',
            file: 'file1.ts',
            line: 10,
          },
          {
            label: 'label2',
            description: 'Description for label2',
            file: 'file2.ts',
            line: 20,
          },
        ],
      };

      reviewCommandOptions.mockTestMatrix = {
        featureTests: [
          {
            feature: 'Feature 1',
            tests: [], // No tests for Feature 1
          },
        ],
      };

      const result = await executeReviewCommandWithMocks(command, reviewCommandOptions);

      expect(result).toContain('## Suggested Labels');
      for (const label of reviewCommandOptions.mockLabels.labels) {
        expect(result).toContain(label.label);
        expect(result).toContain(label.description);
        expect(result).toContain(`${label.file}:${label.line}`);
      }
    });

    it('includes SQL suggestions in the output', async () => {
      const reviewCommandOptions = new ReviewCommandOptions();
      reviewCommandOptions.mockSQLSuggestions = {
        suggestions: [
          {
            type: 'n+1 query',
            context: 'users.all',
            description:
              'This query is inefficient because it retrieves all users without pagination.',
            file: 'users.ts',
            line: 5,
            label: 'n+1 query',
            priority: 'medium',
          },
        ],
      };

      const result = await executeReviewCommandWithMocks(command, reviewCommandOptions);

      expect(result).toContain('## SQL Suggestions');
      expect(result).toContain('n+1 query');
    });

    it('includes HTTP suggestions in the output', async () => {
      const reviewCommandOptions = new ReviewCommandOptions();
      reviewCommandOptions.mockHTTPSuggestions = {
        suggestions: [
          {
            type: 'http 500 error',
            context: 'GET /users',
            description:
              'This request resulted in a server error, indicating an issue with the server handling the request.',
            file: 'users.ts',
            line: 5,
            label: 'http 500 error',
            priority: 'medium',
          },
        ],
      };

      const result = await executeReviewCommandWithMocks(command, reviewCommandOptions);

      expect(result).toContain('## HTTP Suggestions');
      expect(result).toContain('http 500 error');
    });
  });
});
