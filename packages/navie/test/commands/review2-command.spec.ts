import Review2Command from '../../src/commands/review2-command';
import { ExplainOptions } from '../../src/commands/explain-command';
import CompletionService from '../../src/services/completion-service';
import LookupContextService from '../../src/services/lookup-context-service';
import VectorTermsService from '../../src/services/vector-terms-service';
import { UserOptions } from '../../src/lib/parse-options';
import InvokeTestsService from '../../src/services/invoke-tests-service';
import ProjectInfoService from '../../src/services/project-info-service';
import { ProjectInfo } from '../../src/project-info';
import resolveTestItems from '../../src/lib/resolve-test-items';

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

  async function executeReviewCommandWithMocks(
    command: Review2Command,
    mockFeatures: any,
    mockTestMatrix: any,
    userOptions: UserOptions = new UserOptions(new Map())
  ): Promise<string> {
    const mockSuggestions = {
      suggestions: [],
    };

    completionService.json
      .mockResolvedValueOnce(mockFeatures)
      .mockResolvedValueOnce(mockTestMatrix)
      .mockResolvedValueOnce(mockSuggestions);

    const output = command.execute({
      question: 'review',
      userOptions,
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
      const mockFeatures = {
        features: [{ feature: 'Feature 1' }, { feature: 'Feature 2' }, { feature: 'Feature 3' }],
      };

      const mockTestMatrix = {
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

      const result = await executeReviewCommandWithMocks(command, mockFeatures, mockTestMatrix);

      expect(result).toContain('### Suggested Test Commands');
      expect(result).toContain('@test /diff Feature 2');
      expect(result).toContain('@test /diff Feature 3');
      expect(result).not.toContain('@test Feature 1');
    });

    it('should include base branch in @test commands when specified', async () => {
      const mockFeatures = {
        features: [{ feature: 'Feature 1' }, { feature: 'Feature 2' }],
      };

      const mockTestMatrix = {
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

      const userOptions = new UserOptions(new Map([['base', 'main']]));
      const result = await executeReviewCommandWithMocks(
        command,
        mockFeatures,
        mockTestMatrix,
        userOptions
      );

      expect(result).toContain('### Suggested Test Commands');
      expect(result).toContain('@test /diff /base=main Feature 1');
      expect(result).toContain('@test /diff /base=main Feature 2');
    });

    it('should include /nogather flag when testgengather is disabled', async () => {
      const mockFeatures = {
        features: [{ feature: 'Feature 1' }],
      };

      const mockTestMatrix = {
        featureTests: [
          {
            feature: 'Feature 1',
            tests: [], // No tests for Feature 1
          },
        ],
      };

      const userOptions = new UserOptions(new Map([['testgengather', false]]));
      const result = await executeReviewCommandWithMocks(
        command,
        mockFeatures,
        mockTestMatrix,
        userOptions
      );

      expect(result).toContain('### Suggested Test Commands');
      expect(result).toContain('@test /diff /nogather Feature 1');
    });

    it('should not include /nogather flag by default', async () => {
      const mockFeatures = {
        features: [{ feature: 'Feature 1' }],
      };

      const mockTestMatrix = {
        featureTests: [
          {
            feature: 'Feature 1',
            tests: [], // No tests for Feature 1
          },
        ],
      };

      const result = await executeReviewCommandWithMocks(command, mockFeatures, mockTestMatrix);

      expect(result).toContain('### Suggested Test Commands');
      expect(result).toContain('@test /diff Feature 1');
      expect(result).not.toContain('/nogather');
    });
  });
});
