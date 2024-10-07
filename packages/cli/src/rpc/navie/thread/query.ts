import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../../rpc';
import { ThreadIndex } from '.';

export function navieThreadQueryHandler(): RpcHandler<
  NavieRpc.V1.Thread.Query.Params,
  NavieRpc.V1.Thread.Query.Response
> {
  return {
    name: NavieRpc.V1.Thread.Query.Method,
    handler: ({ threadId, maxCreatedAt, orderBy, limit, offset }) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ThreadIndex.getInstance().query({ uuid: threadId, maxCreatedAt, orderBy, limit, offset }),
  };
}
