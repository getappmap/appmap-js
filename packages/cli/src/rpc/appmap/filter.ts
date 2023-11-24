import { AppMapRpc } from '@appland/rpc';
import { buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { RpcError, RpcHandler } from '../rpc';
import { appmapFile } from './appmapFile';
import interpretFilter from './interpretFilter';

export default function appmapFilter(): RpcHandler<
  AppMapRpc.FilterOptions,
  AppMapRpc.FilterResponse
> {
  async function handler(args: AppMapRpc.FilterOptions): Promise<AppMapRpc.FilterResponse> {
    let { appmap: appmapId } = args;
    const { filter: filterArg } = args;

    const filter = interpretFilter(filterArg);
    if (!filter) {
      throw new RpcError(422, 'Invalid filter');
    }

    const appmapStr = await readFile(appmapFile(appmapId), 'utf8');
    const appmap = buildAppMap().source(appmapStr).build();

    return filter.filter(appmap, []);
  }

  return { name: AppMapRpc.FilterFunctionName, handler };
}
