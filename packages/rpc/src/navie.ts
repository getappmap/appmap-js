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

    export namespace UIEvent {
      export const Method = 'v1.navie.ui_event';
      export type Params = {
        event: string;
      };
      export type ResponseSubmitPrompt = Response & {
        action: 'submit_prompt';
        prompt: string;
      };
      export type Response = {
        action: string;
        [key: string]: any;
      };
    }
  }
}
