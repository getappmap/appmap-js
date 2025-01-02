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

  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.resetAllMocks());

  function mockExplain(response: string[]) {
    (explain as jest.Mock).mockResolvedValue({
      userMessageId: 'testUserMessageId',
      threadId: 'testThreadId',
    });

    (explainStatus as jest.Mock).mockReturnValue({
      step: ExplainRpc.Step.COMPLETE,
      explanation: response,
    });
  }

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
    mockExplain([
      JSON.stringify([
        {
          location: 'tests/test_1.spec.js',
          description: 'a test spec',
        },
      ]),
    ]);

    const args: ActivityRpc.V1.Suggest.Tests.Params = {
      taskId: 'task1',
    };

    const result = await activityTestsV1(mockNavieProvider, args);

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('location', 'tests/test_1.spec.js');
    expect(result[0]).toHaveProperty('description', 'a test spec');
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
    mockExplain([
      JSON.stringify([
        {
          location: 'tests/test_1.spec.js',
          description: 'a test spec',
        },
        {
          location: 'src/test_1.spec.js',
          description: 'a test spec',
        },
      ]),
    ]);

    const args: ActivityRpc.V1.Suggest.Tests.Params = {
      taskId: 'task1',
      paths: ['tests'],
    };

    const result = await activityTestsV1(mockNavieProvider, args);

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('location', 'tests/test_1.spec.js');
  });
});
