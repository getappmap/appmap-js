import { NumProcessedOptions, NumProcessedResponse } from './index';
import FingerprintWatchCommand from '../../fingerprint/fingerprintWatchCommand';
import { RpcCallback, RpcHandler } from '../rpc';

export function numProcessed(
  cmd: FingerprintWatchCommand
): RpcHandler<NumProcessedOptions, NumProcessedResponse> {
  function handler(args: NumProcessedOptions, callback: RpcCallback<NumProcessedResponse>) {
    callback(null, cmd.numProcessed);
  }

  return { name: 'index.numProcessed', handler };
}
