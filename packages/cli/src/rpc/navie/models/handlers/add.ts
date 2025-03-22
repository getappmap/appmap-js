import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../../../rpc';
import ModelRegistry from '../registry';
import { verbose } from '../../../../utils';

export function navieModelsAddV1(): RpcHandler<
  NavieRpc.V1.Models.Add.Params,
  NavieRpc.V1.Models.Add.Response
> {
  return {
    name: NavieRpc.V1.Models.Add.Method,
    handler: (models) => {
      if (verbose()) {
        console.log(
          `Adding client models to registry: ${models
            .map((model) => `${model.provider.toLowerCase()}:${model.id.toLowerCase()}`)
            .join(', ')}`
        );
      }
      models.forEach((model) => ModelRegistry.instance.add(model));
    },
  };
}
