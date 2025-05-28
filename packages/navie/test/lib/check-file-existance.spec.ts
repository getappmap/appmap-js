import { ContextV2 } from '../../src/context';
import LookupContextService from '../../src/services/lookup-context-service';
import checkFileExistence from '../../src/lib/check-file-existance';

describe('checkFileExistence', () => {
  let lookupContextService: jest.Mocked<LookupContextService>;

  beforeEach(() => {
    lookupContextService = {
      lookupContext: jest.fn(),
    } as unknown as jest.Mocked<LookupContextService>;
  });

  it('returns files that exist in the context', async () => {
    const filePaths = ['/project/src/file1.ts', '/project/src/file2.ts', '/project/src/file3.ts'];

    lookupContextService.lookupContext.mockResolvedValue([
      {
        directory: '/project/src',
        location: 'file1.ts',
        type: ContextV2.ContextItemType.CodeSnippet,
        content: 'test content',
      },
      {
        directory: '/project/src',
        location: 'file2.ts',
        type: ContextV2.ContextItemType.CodeSnippet,
        content: 'test content',
      },
    ]);

    const result = await checkFileExistence(lookupContextService, filePaths);

    expect(lookupContextService.lookupContext).toHaveBeenCalledWith([], 0, {
      locations: filePaths,
    });
    expect(result).toEqual(new Set(['/project/src/file1.ts', '/project/src/file2.ts']));
  });

  it('filters out non-file context items', async () => {
    const filePaths = ['/project/src/file1.ts'];

    lookupContextService.lookupContext.mockResolvedValue([
      {
        type: ContextV2.ContextItemType.HelpDoc,
        content: 'test content',
      },
    ]);

    const result = await checkFileExistence(lookupContextService, filePaths);

    expect(result).toEqual(new Set([]));
  });
});
