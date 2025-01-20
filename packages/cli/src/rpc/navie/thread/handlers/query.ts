import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../../../rpc';
import { ThreadIndexService } from '../../services/threadIndexService';

export function navieThreadQueryHandler(
  threadIndexService: ThreadIndexService
): RpcHandler<NavieRpc.V1.Thread.Query.Params, NavieRpc.V1.Thread.Query.Response> {
  return {
    name: NavieRpc.V1.Thread.Query.Method,
    handler: ({ threadId, maxCreatedAt, orderBy, limit, offset, projectDirectories }) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      threadIndexService.query({
        uuid: threadId,
        maxCreatedAt,
        orderBy,
        limit,
        offset,
        projectDirectories,
      }),
  };
}
