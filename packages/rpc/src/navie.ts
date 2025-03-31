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

    export namespace Models {
      export type Model = {
        id: string;
        name: string;
        provider: string;
        createdAt: string;
        maxInputTokens?: number;
      };

      export type CustomEndpoint = {
        baseUrl?: string;
        apiKey?: string;
      };

      export type ClientModel = Model & CustomEndpoint;
      export type ListModel = Model & { tags?: string[] };

      export type Config = {
        provider: string;
        apiKey?: string;
        endpoint?: string;
        [key: string]: string | undefined;
      };

      export namespace Add {
        export const Method = 'v1.navie.models.add';
        export type Params = ClientModel[];
        export type Response = void;
      }

      export namespace List {
        export const Method = 'v1.navie.models.list';
        export type Params = void;
        export type Response = Model[];
      }

      export namespace Select {
        export const Method = 'v1.navie.models.select';
        export type Params = { id: string | undefined };
        export type Response = void;
      }

      export namespace GetConfig {
        export const Method: string = 'v1.navie.models.getConfig';
        export type Params = void;
        export type Response = Config[];
      }
    }
    export namespace Thread {
      /**
       * This interface is used to represent data, either as static content or as a resolvable
       * URI, that can be used within a message as context.
       *
       * ### Examples
       * Static content represented with a handle URI:
       * ```json
       * { "uri": "urn:uuid:71881faa-c013-4362-8549-6d3706554190", "content": "My static content" }
       * ```
       *
       * Relative path to a partial code snippet represented via a URI
       * ```json
       * { "uri": "file:app/controllers/user_controller.rb:3-40" }
       * ```
       *
       * A web page
       * ```json
       * { "uri": "https://bevy-cheatbook.github.io/programming/plugins.html" }
       * ```
       *
       * A code snippet, already statically resolved
       * ```json
       * { "uri": "file:user_controller.rb:1", "content": "# frozen_string_literal: true" }
       * ```
       */
      export interface ContextItem {
        /**
         * The URI of the context item. This property is required as a unique identifier.
         * If a context item has no physical location, use a `urn:uuid` URI.
         */
        uri: string;

        /**
         * Static content representing the context item. If this property is present, it may
         * not be resolved by the `uri` property.
         */
        content?: string;
      }
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
          userContext?: ContextItem[];
        };
        export type Response = void;
      }
      export namespace PinItem {
        export const Method = 'v1.navie.thread.pinItem';
        export type Params = ContextItem & {
          threadId: string;
        };
        export type Response = void;
      }
      export namespace UnpinItem {
        export const Method = 'v1.navie.thread.unpinItem';
        export type Params = {
          threadId: string;
          uri: string;
        };
        export type Response = void;
      }
      export namespace AddMessageAttachment {
        export const Method = 'v1.navie.thread.addMessageAttachment';
        export type Params = ContextItem & {
          threadId: string;
        };
        export type Response = void;
      }
      export namespace RemoveMessageAttachment {
        export const Method = 'v1.navie.thread.removeMessageAttachment';
        export type Params = {
          threadId: string;
          uri: string;
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
