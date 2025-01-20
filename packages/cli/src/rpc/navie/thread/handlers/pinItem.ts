import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../../../rpc';
import ThreadService from '../../services/threadService';

export function navieThreadPinItemHandler(
  threadService: ThreadService
): RpcHandler<NavieRpc.V1.Thread.PinItem.Params, NavieRpc.V1.Thread.PinItem.Response> {
  return {
    name: NavieRpc.V1.Thread.PinItem.Method,
    async handler({ threadId, pinnedItem }) {
      const thread = await threadService.getThread(threadId);
      if (!thread) return;

      thread.pinItem(pinnedItem);
    },
  };
}

export function navieThreadUnpinItemHandler(
  threadService: ThreadService
): RpcHandler<NavieRpc.V1.Thread.UnpinItem.Params, NavieRpc.V1.Thread.UnpinItem.Response> {
  return {
    name: NavieRpc.V1.Thread.UnpinItem.Method,
    async handler({ threadId, pinnedItem }) {
      const thread = await threadService.getThread(threadId);
      if (!thread) return;

      thread.unpinItem(pinnedItem);
    },
  };
}
