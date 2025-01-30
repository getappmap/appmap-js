import { ConversationThread } from '@appland/client';

export namespace NavieRpc {
  export namespace V1 {
    export namespace UserContext {
      /**
       * A static item is content that cannot be refreshed, such as a code snippet previously
       * generated.
       */
      export type StaticItem = {
        type: 'static';
        content: string;

        // This is an optional identifier for the item. See how the `git diff` is retrieved from
        // a code snippet in the Navie review command.
        id?: string;
      };

      /**
       * A dynamic item is a URI that can be resolved to a file, web page, or other resource.
       */
      export type DynamicItem = {
        type: 'dynamic';
        uri: string;
      };

      export type ContextItem = StaticItem | DynamicItem;
    }
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
      export namespace SendMessage {
        export const Method = 'v1.navie.thread.sendMessage';
        export type Params = {
          threadId: string;
          content: string;
          userContext?: NavieRpc.V1.UserContext.ContextItem[];
        };
        export type Response = void;
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
          pinnedItem: PinnedUri | PinnedConversationItem;
        };
        export type Response = void;
      }
      export namespace UnpinItem {
        export const Method = 'v1.navie.thread.unpinItem';
        export type Params = {
          threadId: string;
          pinnedItem: PinItem.PinnedUri | PinItem.PinnedConversationItem;
        };
        export type Response = void;
      }
      export namespace AddMessageAttachment {
        export const Method = 'v1.navie.thread.addMessageAttachment';
        export type Params = {
          threadId: string;
          content?: string;
          uri?: string;
        };
        export type Response = { attachmentId: string };
      }
      export namespace RemoveMessageAttachment {
        export const Method = 'v1.navie.thread.removeMessageAttachment';
        export type Params = {
          threadId: string;
          attachmentId: string;
        };
        export type Response = void;
      }
      export namespace Query {
        export const Method = 'v1.navie.thread.query';
        export type Params = {
          threadId?: string;
          maxCreatedAt?: string; // ISO 8601 date
          orderBy?: 'created_at' | 'updated_at';
          limit?: number;
          offset?: number;
          projectDirectories?: string[];
        };
        export type Response = {
          id: string;
          path: string;
          title: string;
          created_at: string;
          updated_at: string;
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
