import { AppMapRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { appmapFilterHandler } from './filter';
import { warn } from 'console';

export default function appmapData(): RpcHandler<
  AppMapRpc.FilterOptions,
  AppMapRpc.FilterResponse
> {
  return { name: AppMapRpc.DataFunctionName, handler: appmapFilterHandler };
}
