import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { AvailableModes } from '@appland/navie';

export function navieCommandsV1(): RpcHandler<
  NavieRpc.V1.Commands.Params,
  NavieRpc.V1.Commands.Response
> {
  return {
    name: NavieRpc.V1.Commands.Method,
    handler: () =>
      AvailableModes.map(({ mode, endUserDescription }) => ({
        command: mode,
        description: endUserDescription,
      })),
  };
}
