import { NavieRpc } from '@appland/rpc';
import { ThreadIndexService } from '../../../../../../src/rpc/navie/services/threadIndexService';
import { navieThreadQueryHandler } from '../../../../../../src/rpc/navie/thread/handlers/query';

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
describe(NavieRpc.V1.Thread.Query.Method, () => {
  let threadIndexService: {
    query: jest.Mock;
  };

  beforeEach(() => {
    threadIndexService = {
      query: jest.fn().mockResolvedValue([]),
    };
  });

  it('passes the query to the thread index service', () => {
    const threadId = 'example-thread-id';
    const maxCreatedAt = new Date().toISOString();
    const orderBy = 'created_at';
    const limit = 10;
    const offset = 5;
    const projectDirectories = ['/home/user/dev/applandinc/appmap-js'];
    const { handler } = navieThreadQueryHandler(
      threadIndexService as unknown as ThreadIndexService
    );

    handler({
      threadId,
      maxCreatedAt,
      orderBy,
      limit,
      offset,
      projectDirectories,
    });

    expect(threadIndexService.query).toHaveBeenCalledWith({
      uuid: threadId,
      maxCreatedAt: new Date(maxCreatedAt),
      orderBy,
      limit,
      offset,
      projectDirectories,
    });
  });
});
