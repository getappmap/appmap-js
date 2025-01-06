/*
  eslint
  @typescript-eslint/no-unsafe-return: 0,
  @typescript-eslint/no-unsafe-assignment: 0,
  @typescript-eslint/no-unsafe-member-access: 0,
  @typescript-eslint/no-unsafe-call: 0
*/
import { EventEmitter } from 'stream';

let eventEmitter: EventEmitter;
let workingDiffContent: string;
const childProcess = {
  stdout: {
    setEncoding: jest.fn(),
    on: jest.fn().mockImplementation((event: string, callback: (data: string) => void) => {
      return eventEmitter.on(event, callback);
    }),
  },
  stderr: {
    setEncoding: jest.fn(),
    on: jest.fn().mockImplementation((event: string, callback: (data: string) => void) => {
      return eventEmitter.on(event, callback);
    }),
  },
  on: jest.fn().mockImplementation((event: string, callback: (data: string) => void) => {
    return eventEmitter.on(event, callback);
  }),
};

jest.mock('node:child_process', () => ({
  execFile: jest.fn().mockReturnValue(childProcess),
}));

jest.mock('../../../../src/lib/git', () => {
  const originalModule = jest.requireActual('../../../../src/lib/git');
  return {
    ...originalModule,
    getWorkingDiff: jest.fn().mockImplementation(() => Promise.resolve(workingDiffContent)),
    getDiffLog: jest
      .fn()
      .mockImplementation((headCommit = 'HEAD', _baseCommit?: string, cwd?: string) => {
        // Force `baseCommit` to be set, so it will not be looked up.
        return originalModule.getDiffLog(headCommit, 'base', cwd);
      }),
  };
});

import handleReview from '../../../../src/rpc/explain/review';

describe('handleReview', () => {
  const diffContent = 'git diff here';

  beforeEach(() => {
    // Prevent re-binding listeners to the same event emitter.
    eventEmitter = new EventEmitter();
    workingDiffContent = '';
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  const emitResult = (output: string, exitCode = 0) => {
    eventEmitter.emit('data', output);
    eventEmitter.emit('close', exitCode);
  };

  it('does nothing if the command is not "review"', async () => {
    const result = await handleReview('hello');
    expect(result).toStrictEqual({ applied: false });
  });

  it('converts string user context to a context array', async () => {
    workingDiffContent = 'working changes here';
    const result = handleReview('@review', 'print("hello")');
    emitResult(diffContent);
    await expect(result).resolves.toStrictEqual({
      applied: true,
      userContext: [
        { type: 'code-selection', content: 'print("hello")' },
        {
          type: 'code-snippet',
          location: 'git diff',
          content: `${workingDiffContent}\n\n${diffContent}`,
        },
      ],
    });
  });

  it('returns an expected user context when it was initially undefined', async () => {
    const result = handleReview('@review');
    emitResult(diffContent);
    await expect(result).resolves.toStrictEqual({
      applied: true,
      userContext: [{ type: 'code-snippet', location: 'git diff', content: diffContent }],
    });
  });

  it('returns an expected user context when it was initially a context array', async () => {
    const result = handleReview('@review', [{ type: 'code-selection', content: 'print("hello")' }]);
    emitResult(diffContent);
    await expect(result).resolves.toStrictEqual({
      applied: true,
      userContext: [
        { type: 'code-selection', content: 'print("hello")' },
        { type: 'code-snippet', location: 'git diff', content: diffContent },
      ],
    });
  });

  it('raises an error if the command fails', async () => {
    const result = handleReview('@review');
    emitResult('git diff here', 1);
    await expect(result).rejects.toThrowError('git diff here');
  });
});
