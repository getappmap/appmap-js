import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { INavieProvider } from '../explain/navie/inavie';

// We don't want to support context lookups
const NOP = () => Promise.resolve([]);
const NOP_OBJECT = () => Promise.resolve(undefined);

export function getSuggestions(
  navieProvider: INavieProvider,
  threadId: string
): Promise<NavieRpc.V1.Suggest.Response> {
  const navie = navieProvider(NOP, NOP, NOP, NOP_OBJECT as any);
  return new Promise((resolve, reject) => {
    navie
      .on('token', (response: string) =>
        resolve(JSON.parse(response) as NavieRpc.V1.Suggest.Response)
      )
      .on('error', reject)
      .ask(threadId, '@suggest /nocontext /nohelp', undefined, undefined)
      .catch(reject);
  });
}

export function navieSuggestHandlerV1(
  navieProvider: INavieProvider
): RpcHandler<NavieRpc.V1.Suggest.Params, NavieRpc.V1.Suggest.Response> {
  return {
    name: NavieRpc.V1.Suggest.Method,
    handler: (params) => getSuggestions(navieProvider, params.threadId),
  };
}
