import { AppMapRpc } from '@appland/rpc';
import { AppMapFilter, buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { RpcError, RpcHandler } from '../rpc';
import { appmapFile } from './appmapFile';
import interpretFilter from './interpretFilter';
import { warn } from 'console';
import configuration from '../configuration';
import { isAbsolute, join } from 'path';

export async function appmapFilterHandler(
  args: AppMapRpc.FilterOptions
): Promise<AppMapRpc.FilterResponse> {
  warn(
    `RPC handler ${AppMapRpc.FilterFunctionName} is deprecated, use ${AppMapRpc.DataFunctionName} instead`
  );

  let { appmap: appmapId } = args;
  const { filter: filterArg } = args;

  let filter = interpretFilter(filterArg);
  if (!filter) {
    filter = new AppMapFilter();
  }

  let filePath = appmapFile(appmapId);
  if (!isAbsolute(filePath)) {
    const directories = await configuration().appmapDirectories();
    if (directories.length === 1) filePath = join(directories[0].directory, filePath);
  }

  const appmapStr = await readFile(filePath, 'utf8');
  const appmap = buildAppMap().source(appmapStr).build();

  return filter.filter(appmap, []) as unknown as Record<string, unknown>;
}

export default function appmapFilter(): RpcHandler<
  AppMapRpc.FilterOptions,
  AppMapRpc.FilterResponse
> {
  return { name: AppMapRpc.FilterFunctionName, handler: appmapFilterHandler };
}
