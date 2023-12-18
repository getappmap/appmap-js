import { AppMapRpc } from '@appland/rpc';
import { AppMapFilter, buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { RpcHandler } from '../rpc';
import { appmapFile } from './appmapFile';
import interpretFilter from './interpretFilter';
import { warn } from 'console';

export async function appmapFilterHandler(
  args: AppMapRpc.FilterOptions
): Promise<AppMapRpc.FilterResponse> {
  let { appmap: appmapId } = args;
  const { filter: filterArg } = args;

  let filter = interpretFilter(filterArg);
  if (!filter) {
    filter = new AppMapFilter();
  }

  const appmapStr = await readFile(appmapFile(appmapId), 'utf8');
  const appmap = buildAppMap().source(appmapStr).build();

  return filter.filter(appmap, []) as unknown as Record<string, unknown>;
}
export default function appmapFilter(): RpcHandler<
  AppMapRpc.FilterOptions,
  AppMapRpc.FilterResponse
> {
  warn(
    `RPC handler ${AppMapRpc.FilterFunctionName} is deprecated, use ${AppMapRpc.DataFunctionName} instead`
  );
  return { name: AppMapRpc.FilterFunctionName, handler: appmapFilterHandler };
}
