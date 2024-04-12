export namespace PromptRpc {
  export namespace V1 {
    export namespace Suggestions {
      export const Method = 'v1.prompt.suggestions';
      export type Params = undefined;
      export type Response = Array<PromptSuggestion>;
    }
  }

  export type PromptSuggestion = {
    name: string;
    description: string;
    prompt: string;
  };
}
