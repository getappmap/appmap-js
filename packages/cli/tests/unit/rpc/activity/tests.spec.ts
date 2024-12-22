import { ActivityRpc, ExplainRpc } from '@appland/rpc';

import { INavieProvider } from '../../../../src/rpc/explain/navie/inavie';
import { activityTestsV1 } from '../../../../src/rpc/activity/tests';
import { currentActivity } from '../../../../src/rpc/activity/current';
import { explain, explainStatus } from '../../../../src/rpc/explain/explain';

// Mock explain and explainStatus
jest.mock('../../../../src/rpc/explain/explain', () => ({
  explain: jest.fn(),
  explainStatus: jest.fn(),
}));

jest.mock('../../../../src/rpc/activity/current');

describe('activityTestsV1', () => {
  const mockNavieProvider: INavieProvider = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementation for explain
    (explain as jest.Mock).mockResolvedValue({
      userMessageId: 'testUserMessageId',
      threadId: 'testThreadId',
    });

    // Setup mock implementation for explainStatus
    (explainStatus as jest.Mock).mockReturnValue({
      step: ExplainRpc.Step.COMPLETE,
    });
  });

  afterEach(() => jest.resetAllMocks());

  it('should return test suggestions based on current activity', async () => {
    const mockActivityResponse: ActivityRpc.V1.Current.Response = {
      name: 'current',
      title: 'Current Activity',
      description: 'No activity detected',
      projectStates: [
        {
          projectDirectory: '/path/to/project',
          commit: 'HEAD',
          branch: 'main',
          baseBranch: 'main',
          diffs: ['diff1', 'diff2'],
          diffDigest: 'digest1',
        },
      ],
      digest: 'digest1',
    };

    (currentActivity as jest.Mock).mockResolvedValue(mockActivityResponse);

    const args: ActivityRpc.V1.Suggest.Tests.Params = {
      taskId: 'task1',
      codeSelection: 'some code selection',
      prompt: 'some prompt',
      paths: ['/path/to/project'],
      keywords: ['keyword1', 'keyword2'],
    };

    const result = await activityTestsV1(mockNavieProvider, args);

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    // TODO: Add more specific assertions based on the expected structure of the response
  });

  it('should filter results based on specified paths', async () => {
    const mockActivityResponse: ActivityRpc.V1.Current.Response = {
      name: 'current',
      title: 'Current Activity',
      description: 'No activity detected',
      projectStates: [
        {
          projectDirectory: '/path/to/project',
          commit: 'HEAD',
          branch: 'main',
          baseBranch: 'main',
          diffs: ['diff1', 'diff2'],
          diffDigest: 'digest1',
        },
      ],
      digest: 'digest1',
    };

    (currentActivity as jest.Mock).mockResolvedValue(mockActivityResponse);

    const args: ActivityRpc.V1.Suggest.Tests.Params = {
      taskId: 'task1',
      codeSelection: 'some code selection',
      prompt: 'some prompt',
      paths: ['/path/to/project'],
      keywords: ['keyword1', 'keyword2'],
    };

    const result = await activityTestsV1(mockNavieProvider, args);

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    // TODO: Add more specific assertions based on the expected structure of the response
  });
});
