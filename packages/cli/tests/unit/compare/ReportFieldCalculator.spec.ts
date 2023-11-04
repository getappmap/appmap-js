import { dump } from 'js-yaml';
import ReportFieldCalculator from '../../../src/cmds/compare/ReportFieldCalculator';
import ChangeAnalysis from '../../../src/diffArchive/ChangeAnalysis';
import { RevisionName } from '../../../src/diffArchive/RevisionName';

describe('ReportFieldCalculator', () => {
  let calculator: ReportFieldCalculator;

  describe('when provided invalid OpenAPI', () => {
    const openAPI = {
      [RevisionName.Base]: dump({
        openapi: '3.0.1',
        info: {
          title: 'My project',
          version: 'v1',
        },
        paths: {
          '/': {
            get: {
              responses: {
                '200': {
                  content: {
                    'text/html': {},
                  },
                  description: 'OK',
                },
              },
            },
          },
        },
      }),
      [RevisionName.Head]: dump({
        openapi: '3.0.1',
        info: {
          title: 'My project',
          version: 'v1',
        },
        paths: {
          '/': {
            get: {
              responses: {
                '-1': {
                  content: {
                    'text/html': {},
                  },
                  description: 'OK',
                },
              },
            },
          },
        },
      }),
    };

    it('issues a warning', async () => {
      // Stub readFile with jest
      calculator = new ReportFieldCalculator({} as ChangeAnalysis);

      calculator['readOpenAPI'] = jest
        .fn()
        .mockImplementation(
          async (revision: RevisionName): Promise<string | undefined> => openAPI[revision]
        );

      await calculator.apiDiff(true);

      expect(calculator.warnings.map((w) => w.field)).toContain('apiDiff');
      expect(calculator.warnings.map((w) => w.message).join('\n')).toContain(
        `Validation errors in "head"`
      );
    });
  });
});
