import Review2Command from '../../src/commands/review2-command';
import { ExplainOptions } from '../../src/commands/explain-command';
import CompletionService from '../../src/services/completion-service';
import LookupContextService from '../../src/services/lookup-context-service';
import VectorTermsService from '../../src/services/vector-terms-service';
import { UserOptions } from '../../src/lib/parse-options';

describe('Review2Command', () => {
  let command: Review2Command;
  let completionService: jest.Mocked<CompletionService>;
  let lookupContextService: jest.Mocked<LookupContextService>;
  let vectorTermsService: jest.Mocked<VectorTermsService>;

  beforeEach(() => {
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

    command = new Review2Command(
      { tokenLimit: 1000 } as ExplainOptions,
      completionService,
      lookupContextService,
      vectorTermsService
    );
  });

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

      const mockSuggestions = {
        suggestions: [],
      };

      completionService.json
        .mockResolvedValueOnce(mockFeatures)
        .mockResolvedValueOnce(mockTestMatrix)
        .mockResolvedValueOnce(mockSuggestions);

      const output = command.execute({
        question: 'review',
        userOptions: new UserOptions(new Map()),
        codeSelection: [
          {
            type: 'code-snippet',
            location: 'git diff',
            content: 'test diff content',
          },
        ],
      });
      // Accumulate the output
      const tokens = [];
      for await (const token of output) {
        tokens.push(token);
      }
      const result = tokens.join('');

      // Verify the output contains test suggestions section
      expect(result).toContain('### Suggested Test Commands');
      expect(result).toContain('@test Feature 2');
      expect(result).toContain('@test Feature 3');
      expect(result).not.toContain('@test Feature 1'); // Feature 1 has tests, so no suggestion needed
    });
  });
});
