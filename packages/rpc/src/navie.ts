import { ConversationThread } from '@appland/client';

export namespace NavieRpc {
  export namespace V1 {
    export namespace Metadata {
      export type Command = {
        name: string;
        description: string;
        referenceUrl?: string;
        demoUrls?: string[];
      };

      export const Method = 'v1.navie.metadata';
      export type Params = {};
      export type Response = {
        welcomeMessage?: string;
        inputPlaceholder?: string;
        commands: Command[];
      };
    }

    export namespace Suggest {
      export const Method = 'v1.navie.suggest';
      export type NextStep = {
        command: 'generate' | 'diagram' | 'plan' | 'test' | 'explain' | 'help';
        prompt: string;
        label: string;
        overallScore: number;
      };
      export type Params = {
        threadId: string;
      };
      export type Response = NextStep[];
    }

    export namespace Register {
      export const Method = 'v1.navie.register';
      export type Params = {};
      export type Response = {
        thread: ConversationThread;
      };
    }
    export namespace Thread {
      export namespace Subscribe {
        export const Method = 'v1.navie.thread.subscribe';
        export type Params = {
          threadId: string;
          nonce?: number;
          replay?: boolean;
        };
        export type Response = {
          /*
            This is a non-standard JSON RPC method.
            Invoking this method will open an event stream.
          */
        };
      }
      export type ResponseOk = { ok: true };
      export type ResponseError = { ok: false; error: unknown };
      export namespace SendMessage {
        export const Method = 'v1.navie.thread.sendMessage';
        export type Params = {
          threadId: string;
          content: string;
          codeSelection?: string;
        };
        export type Response = ResponseOk | ResponseError;
      }
      export namespace PinItem {
        export const Method = 'v1.navie.thread.pinItem';
        export type PinnedUri = {
          uri: string;
        };
        export type PinnedConversationItem = {
          handle: number;
        };
        export type Params = {
          threadId: string;
          operation: 'pin' | 'unpin';
          pinnedItem: PinnedUri | PinnedConversationItem;
        };
        export type Response = void;
      }
      export namespace Query {
        export const Method = 'v1.navie.thread.query';
        export type Params = {
          threadId?: string;
          maxCreatedAt?: Date;
          orderBy?: 'created_at' | 'updated_at';
          limit?: number;
          offset?: number;
        };
        export type Response = {
          id: string;
          path: string;
          title: string;
          createdAt: Date;
          updatedAt: Date;
        }[];
      }
    }
  }

  export namespace V2 {
    export namespace Metadata {
      export const Method = 'v2.navie.metadata';
      export type Params = {};
      export type Response = {
        inputPlaceholder?: string;
        commands: NavieRpc.V1.Metadata.Command[];
      };
    }

    export namespace Welcome {
      export const Method = 'v2.navie.welcome';
      export type Params = {
        codeSelection?: string;
      };
      export type StaticMessage = {
        message: string;
      };
      export type DynamicActivity = {
        activity: string;
        suggestions: string[];
      };
      export type Response = StaticMessage | DynamicActivity;
    }
  }
}
