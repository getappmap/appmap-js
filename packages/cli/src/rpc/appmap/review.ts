import { AppMapRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { INavieProvider } from '../explain/navie/inavie';
import { getChangeSummary } from '../../cmds/review';

// We don't want to support context lookups
const NOP = () => Promise.resolve([]);

async function performReview(
  navieProvider: INavieProvider,
  baseRef: string
): Promise<AppMapRpc.Review.V1.Response> {
  const navie = navieProvider(NOP, NOP, NOP);
  const changeSummary = await getChangeSummary(baseRef);
  return new Promise((resolve, reject) => {
    navie
      .on('token', (response: string) => resolve(response as AppMapRpc.Review.V1.Response))
      .on('error', reject)
      .ask(undefined, `@review ${JSON.stringify(changeSummary)}`, undefined, undefined)
      .catch(reject);
  });
}

export function appmapReviewV1(
  navieProvider: INavieProvider
): RpcHandler<AppMapRpc.Review.V1.Params, AppMapRpc.Review.V1.Response> {
  return {
    name: AppMapRpc.Review.V1.Method,
    handler: (params) => performReview(navieProvider, params.baseRef),
  };
}
