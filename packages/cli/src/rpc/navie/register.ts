import {
  type ConversationThread,
} from '@appland/client';
import { NavieRpc } from '@appland/rpc';

import createConversationThread from '../../lib/createConversationThread';
import { RpcHandler } from '../rpc';

import ThreadService from './services/threadService';

export async function register(
  threadService: ThreadService,
  codeEditor: string | undefined
): Promise<NavieRpc.V1.Register.Response> {
  const thread: ConversationThread = {
    id: await createConversationThread(codeEditor),
    permissions: {
      useNavieAIProxy: false,
    },
    usage: {
      conversationCounts: [],
    },
    subscription: {
      enrollmentDate: new Date(),
      subscriptions: [],
    },
  };

  await threadService.registerThread(thread);

  return { thread };
}

export function navieRegisterV1(
  threadService: ThreadService,
  codeEditor?: string
): RpcHandler<NavieRpc.V1.Register.Params, NavieRpc.V1.Register.Response> {
  return {
    name: NavieRpc.V1.Register.Method,
    handler: async () => {
      return register(threadService, codeEditor);
    },
  };
}
