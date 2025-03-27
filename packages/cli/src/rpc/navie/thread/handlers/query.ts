/* eslint-disable @typescript-eslint/no-unsafe-assignment,
                  @typescript-eslint/no-unsafe-member-access,
                  @typescript-eslint/no-unsafe-argument */
import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../../../rpc';
import { ThreadIndexService } from '../../services/threadIndexService';

export function navieThreadQueryHandler(
  threadIndexService: ThreadIndexService
): RpcHandler<NavieRpc.V1.Thread.Query.Params, NavieRpc.V1.Thread.Query.Response> {
  return {
    name: NavieRpc.V1.Thread.Query.Method,
    handler: ({ threadId, maxCreatedAt, orderBy, limit, offset, projectDirectories }) =>
      threadIndexService.query({
        uuid: threadId,
        maxCreatedAt: maxCreatedAt ? new Date(maxCreatedAt) : undefined,
        orderBy,
        limit,
        offset,
        projectDirectories,
      }),
  };
}
