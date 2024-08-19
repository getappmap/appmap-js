import type InteractionHistory from '../interaction-history';

export type PostResponseHookResult = string | undefined | Promise<string | undefined>;
export default interface PostResponseHook {
  condition(interactionHistory: InteractionHistory): boolean;
  execute(interactionHistory: InteractionHistory): PostResponseHookResult;
}
