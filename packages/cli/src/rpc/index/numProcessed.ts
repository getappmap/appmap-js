import { IndexRpc } from '@appland/rpc';
import FingerprintWatchCommand from '../../fingerprint/fingerprintWatchCommand';
import { RpcCallback, RpcHandler } from '../rpc';

export function numProcessed(
  cmd: FingerprintWatchCommand
): RpcHandler<IndexRpc.NumProcessedOptions, IndexRpc.NumProcessedResponse> {
  function handler(
    args: IndexRpc.NumProcessedOptions,
    callback: RpcCallback<IndexRpc.NumProcessedResponse>
  ) {
    callback(null, cmd.numProcessed);
  }

  return { name: IndexRpc.NumProcessedFunctionName, handler };
}
