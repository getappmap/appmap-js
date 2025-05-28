import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { ContextV2, Message, UserContext } from '../../src';
import { default as navieFactory, NavieOptions } from '../../src/navie';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import * as completionServiceFactory from '../../src/services/completion-service-factory';

jest.mock('../../src/services/completion-service-factory', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('console', () => ({
  warn: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
}));

describe('Pinned items', () => {
  let contextProvider: jest.Mock;
  let projectInfoProvider: jest.Mock;
  let helpProvider: jest.Mock;
  let testInvocationProvider: jest.Mock;
  let completionService: { model: string; json: jest.Mock; complete: jest.Mock };
  let tmpDir: string;
  let pinnedFilePath: string;
  const pinnedFileContent = 'Hello from a pinned file';

  beforeEach(async () => {
    jest.resetAllMocks();
    completionService = {
      model: 'mock',
      json: jest.fn().mockResolvedValue({}),
      complete: jest.fn().mockImplementation(function* () {
        yield 'completion';
      }),
    };
    (completionServiceFactory.default as jest.Mock).mockReturnValue(completionService);
    contextProvider = jest.fn().mockImplementation(async (req: ContextV2.ContextRequest) => {
      if (req.locations) {
        const fullTextLocations = await Promise.all(
          req.locations.map(async (location) => {
            const filePath = location.replace(':0', '');
            if (!filePath) return undefined;

            const content = await readFile(filePath, 'utf8');
            return {
              type: ContextV2.ContextItemType.CodeSnippet,
              content,
              location,
              directory: dirname(location),
            };
          })
        );
        return fullTextLocations.filter(Boolean);
      }
      return [];
    });
    projectInfoProvider = jest.fn();
    helpProvider = jest.fn();
    testInvocationProvider = jest.fn();
    tmpDir = await mkdtemp(join(tmpdir(), 'pinned-items-spec-'));
    pinnedFilePath = join(tmpDir, 'pinned-file.ts');
    await writeFile(pinnedFilePath, pinnedFileContent);

    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  const invokeNavie = async (
    question: string,
    pinnedItems: UserContext.FileItem[] = [],
    chatHistory: Message[] = []
  ) => {
    const completion = navieFactory(
      { question, codeSelection: pinnedItems },
      contextProvider,
      projectInfoProvider,
      helpProvider,
      testInvocationProvider,
      new NavieOptions(),
      chatHistory
    ).execute();
    let buffer = '';
    for await (const chunk of completion) buffer += chunk;
    return buffer;
  };

  const expectMessageContains = (role: 'user' | 'assistant' | 'system', partialContent: string) =>
    expect(completionService.complete).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          role,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          content: expect.stringContaining(partialContent),
        }),
      ]),
      expect.anything()
    );

  const expectMessageNotContains = (
    role: 'user' | 'assistant' | 'system',
    partialContent: string
  ) =>
    completionService.complete.mock.calls.forEach(([messages]: Message[][]) =>
      messages.forEach((message: Message) => {
        if (message.role === role) {
          expect(message.content).not.toContain(partialContent);
        }
      })
    );
  describe('@explain', () => {
    // eslint-disable-next-line jest/expect-expect
    it('renders pinned items to the user message', async () => {
      const question = 'analyze this';
      await invokeNavie(question, [{ type: 'file', location: pinnedFilePath }]);
      expectMessageContains('user', pinnedFileContent);
      expectMessageContains('user', pinnedFilePath);
      expectMessageContains('user', question);
      expectMessageNotContains('system', pinnedFileContent);
    });
  });
});
