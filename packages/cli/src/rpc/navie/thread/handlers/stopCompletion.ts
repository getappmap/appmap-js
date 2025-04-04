import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../../../rpc';
import ThreadService from '../../services/threadService';

export function navieThreadStopCompletionHandler(
  threadService: ThreadService
): RpcHandler<
  NavieRpc.V1.Thread.StopCompletion.Params,
  NavieRpc.V1.Thread.StopCompletion.Response
> {
  return {
    name: NavieRpc.V1.Thread.StopCompletion.Method,
    async handler({ threadId }): Promise<NavieRpc.V1.Thread.StopCompletion.Response> {
      const thread = await threadService.getThread(threadId);
      return thread.stopCompletion();
    },
  };
}
