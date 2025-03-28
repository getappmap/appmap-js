import { NavieRpc } from '@appland/rpc';
import ThreadService from '../../services/threadService';
import { RpcError, RpcHandler } from '../../../rpc';

export function navieThreadAddMessageAttachmentHandler(
  threadService: ThreadService
): RpcHandler<
  NavieRpc.V1.Thread.AddMessageAttachment.Params,
  NavieRpc.V1.Thread.AddMessageAttachment.Response
> {
  return {
    name: NavieRpc.V1.Thread.AddMessageAttachment.Method,
    async handler({ threadId, uri, content }) {
      if (!uri && !content) throw new RpcError(400, 'must specify at least one of uri or content');

      const thread = await threadService.getThread(threadId);
      thread.addMessageAttachment(uri, content);
    },
  };
}

export function navieThreadRemoveMessageAttachmentHandler(
  threadService: ThreadService
): RpcHandler<
  NavieRpc.V1.Thread.RemoveMessageAttachment.Params,
  NavieRpc.V1.Thread.RemoveMessageAttachment.Response
> {
  return {
    name: NavieRpc.V1.Thread.RemoveMessageAttachment.Method,
    async handler({ threadId, uri }) {
      const thread = await threadService.getThread(threadId);
      thread.removeMessageAttachment(uri);
    },
  };
}
