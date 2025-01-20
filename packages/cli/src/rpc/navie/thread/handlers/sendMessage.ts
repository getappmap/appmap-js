import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../../../rpc';
import ThreadService from '../../services/threadService';

export function navieThreadSendMessageHandler(
  threadService: ThreadService
): RpcHandler<NavieRpc.V1.Thread.SendMessage.Params, NavieRpc.V1.Thread.SendMessage.Response> {
  return {
    name: NavieRpc.V1.Thread.SendMessage.Method,
    async handler({
      threadId,
      content,
      userContext,
    }): Promise<NavieRpc.V1.Thread.SendMessage.Response> {
      const thread = await threadService.getThread(threadId);
      if (!thread) {
        const errorMessage = `Thread ${threadId} not found`;
        console.warn(errorMessage);
        return { ok: false, error: errorMessage };
      }

      try {
        await thread.sendMessage(content, userContext);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err };
      }
    },
  };
}
