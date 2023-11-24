import { AppMapRpc } from '@appland/rpc';
import { readFile } from 'fs/promises';
import { RpcError, RpcHandler } from '../rpc';
import { join } from 'path';

export default function metadata(): RpcHandler<
  AppMapRpc.MetadataOptions,
  AppMapRpc.MetadataResponse
> {
  async function handler(args: AppMapRpc.MetadataOptions): Promise<AppMapRpc.MetadataResponse> {
    let { appmap: appmapId } = args;

    if (appmapId.endsWith('.appmap.json')) appmapId = appmapId.slice(0, -'.appmap.json'.length);

    let metadataStr: string | undefined;
    try {
      metadataStr = await readFile(join(appmapId, 'metadata.json'), 'utf8');
    } catch {
      throw new RpcError(404, `${appmapId} metadata not found`);
    }
    return JSON.parse(metadataStr);
  }

  return { name: AppMapRpc.MetadataFunctionName, handler };
}
