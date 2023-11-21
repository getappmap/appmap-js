import { AppMapRpc } from '@appland/rpc';
import { readFile } from 'fs/promises';
import { RpcCallback, RpcHandler } from '../rpc';
import { join } from 'path';

export default function metadata(): RpcHandler<
  AppMapRpc.MetadataOptions,
  AppMapRpc.MetadataResponse
> {
  async function handler(
    args: AppMapRpc.MetadataOptions,
    callback: RpcCallback<AppMapRpc.MetadataResponse>
  ) {
    let { appmap: appmapId } = args;

    if (appmapId.endsWith('.appmap.json')) appmapId = appmapId.slice(0, -'.appmap.json'.length);

    let metadataStr: string | undefined;
    try {
      metadataStr = await readFile(join(appmapId, 'metadata.json'), 'utf8');
    } catch {
      callback({ code: 404, message: `${appmapId} metadata not found` });
      return;
    }
    const metadata = JSON.parse(metadataStr);
    callback(null, metadata);
  }

  return { name: AppMapRpc.MetadataFunctionName, handler };
}
