import { AppMapRpc } from '@appland/rpc';
import { buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { RpcCallback, RpcHandler } from '../rpc';
import { appmapFile } from './appmapFile';
import interpretFilter from './interpretFilter';

export default function appmapFilter(): RpcHandler<
  AppMapRpc.FilterOptions,
  AppMapRpc.FilterResponse
> {
  async function handler(
    args: AppMapRpc.FilterOptions,
    callback: RpcCallback<AppMapRpc.FilterResponse>
  ) {
    let { appmap: appmapId } = args;
    const { filter: filterArg } = args;

    const filter = interpretFilter(filterArg);
    if (!filter) {
      callback({ code: 422, message: 'Invalid filter' });
      return;
    }

    const appmapStr = await readFile(appmapFile(appmapId), 'utf8');
    const appmap = buildAppMap().source(appmapStr).build();

    const filteredAppMap = filter.filter(appmap, []);
    callback(null, filteredAppMap);
  }

  return { name: AppMapRpc.FilterFunctionName, handler };
}
