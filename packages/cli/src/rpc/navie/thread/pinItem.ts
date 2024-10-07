import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../../rpc';
import { getThread } from '.';

export function navieThreadPinItemHandler(): RpcHandler<
  NavieRpc.V1.Thread.PinItem.Params,
  NavieRpc.V1.Thread.PinItem.Response
> {
  return {
    name: NavieRpc.V1.Thread.PinItem.Method,
    async handler({ threadId, pinnedItem, operation }) {
      const thread = await getThread(threadId);
      if (!thread) return;

      thread.pinItem({ operation, ...pinnedItem });
    },
  };
}
