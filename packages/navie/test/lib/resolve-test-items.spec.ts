import { z } from 'zod';
import { TestItem } from '../../src/commands/review2-command';
import LookupContextService from '../../src/services/lookup-context-service';
import resolveTestItems from '../../src/lib/resolve-test-items';
import { ProjectInfo } from '../../src/project-info';
import { ContextV2 } from '../../src';

jest.mock('../../src/services/lookup-context-service');

describe('resolveTestItems', () => {
  let lookupContextService: jest.Mocked<LookupContextService>;
  let projectInfos: ProjectInfo[];

  beforeEach(() => {
    lookupContextService = {
      lookupContext: jest.fn(),
    } as unknown as jest.Mocked<LookupContextService>;

    projectInfos = [
      {
        directory: '/test/project-1',
      },
      {
        directory: '/test/project-2',
      },
    ];

    jest.resetAllMocks();
  });

  const createTestItem = (file: string): z.infer<typeof TestItem> => ({
    file,
    testName: `test ${file}`,
  });

  it('should filter out files that do not exist', async () => {
    const testItems = [
      createTestItem('test1.spec.ts'),
      createTestItem('test2.spec.ts'),
      createTestItem('/test/project-3/test3.spec.ts'),
    ];

    lookupContextService.lookupContext.mockResolvedValue([
      {
        directory: '/test/project-1',
        location: 'test1.spec.ts',
        type: ContextV2.ContextItemType.CodeSnippet,
        content: 'file 1',
      },
      {
        directory: '/test/project-2',
        location: 'other-test.spec.ts',
        type: ContextV2.ContextItemType.CodeSnippet,
        content: 'file other',
      },
      {
        directory: '/test/project-3',
        location: 'test3.spec.ts',
        type: ContextV2.ContextItemType.CodeSnippet,
        content: 'file 3',
      },
    ]);

    const result = await resolveTestItems(lookupContextService, projectInfos, testItems);

    expect(lookupContextService.lookupContext).toHaveBeenCalledWith([], 0, {
      locations: [
        '/test/project-1/test1.spec.ts',
        '/test/project-2/test1.spec.ts',
        '/test/project-1/test2.spec.ts',
        '/test/project-2/test2.spec.ts',
        '/test/project-3/test3.spec.ts',
      ],
    });

    expect(result).toEqual([testItems[0], testItems[2]]);
  });
});
