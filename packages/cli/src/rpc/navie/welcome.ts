import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { INavieProvider } from '../explain/navie/inavie';
import { getWelcomeMessage } from './welcome-suggestion';

export function navieWelcomeV2(
  navieProvider: INavieProvider
): RpcHandler<NavieRpc.V2.Welcome.Params, NavieRpc.V2.Welcome.Response> {
  return {
    name: NavieRpc.V2.Welcome.Method,
    handler: async (params: NavieRpc.V2.Welcome.Params) =>
      getWelcomeMessage(navieProvider, params.codeSelection),
  };
}
