import { IndexRpc } from '@appland/rpc';
import FingerprintWatchCommand from '../../fingerprint/fingerprintWatchCommand';
import { RpcHandler } from '../rpc';

export function numProcessed(
  cmd: FingerprintWatchCommand
): RpcHandler<IndexRpc.NumProcessedOptions, IndexRpc.NumProcessedResponse> {
  function handler(args: IndexRpc.NumProcessedOptions): IndexRpc.NumProcessedResponse {
    return cmd.numProcessed;
  }

  return { name: IndexRpc.NumProcessedFunctionName, handler };
}
