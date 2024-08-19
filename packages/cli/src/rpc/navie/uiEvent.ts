import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';

function handleUiEvent(params: NavieRpc.V1.UIEvent.Params): NavieRpc.V1.UIEvent.Response {
  switch (params.event) {
    case 'generate-code':
      return {
        action: 'submit_prompt',
        prompt: '@generate',
      };
    case 'create-diagram':
      return {
        action: 'submit_prompt',
        prompt: '@diagram',
      };
    case 'plan':
      return {
        action: 'submit_prompt',
        prompt: '@plan an implementation of the above',
      };
    case 'test-cases':
      return {
        action: 'submit_prompt',
        prompt: '@test',
      };
    default:
      throw new Error(`Unknown event: ${params.event}`);
  }
}

export function navieUiEventHandlerV1(): RpcHandler<
  NavieRpc.V1.UIEvent.Params,
  NavieRpc.V1.UIEvent.Response
> {
  return {
    name: NavieRpc.V1.UIEvent.Method,
    handler: handleUiEvent,
  };
}
