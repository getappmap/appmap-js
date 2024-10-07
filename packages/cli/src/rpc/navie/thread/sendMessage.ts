import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../../rpc';
import { getThread } from '.';

export function navieThreadSendMessageHandler(): RpcHandler<
  NavieRpc.V1.Thread.SendMessage.Params,
  NavieRpc.V1.Thread.SendMessage.Response
> {
  return {
    name: NavieRpc.V1.Thread.SendMessage.Method,
    async handler({
      threadId,
      content,
      codeSelection,
    }): Promise<NavieRpc.V1.Thread.SendMessage.Response> {
      const thread = await getThread(threadId);
      if (!thread) {
        const errorMessage = `Thread ${threadId} not found`;
        console.warn(errorMessage);
        return { ok: false, error: errorMessage };
      }

      try {
        await thread.sendMessage(content, codeSelection);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err };
      }
    },
  };
}
