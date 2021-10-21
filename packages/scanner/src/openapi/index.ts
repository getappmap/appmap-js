import provider from './provider';
import openapiDiff from 'openapi-diff';
import Model from './model';
import SecuritySchemes from './securitySchemes';
import { rpcRequestForEvent } from './rpcRequest';
import { Event } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';

interface OpenAPIV3Fragment {
  paths: OpenAPIV3.PathItemObject;
  components: Record<string, OpenAPIV3.SecuritySchemeObject>;
}

const forClientRequest = (event: Event): OpenAPIV3Fragment | undefined => {
  const rpcRequest = rpcRequestForEvent(event);
  if (!rpcRequest) {
    return;
  }

  const securitySchemes = new SecuritySchemes();
  const model = new Model();
  securitySchemes.addRpcRequest(rpcRequest);
  model.addRpcRequest(rpcRequest);

  return { paths: model.openapi(), components: securitySchemes.openapi() };
};

const forURL = async (url: string, workingDir: string): Promise<any> => {
  return provider(url, workingDir);
};

const isCompatible = async (clientSchema: any, serverSchema: any): Promise<boolean> => {
  const result = await openapiDiff.diffSpecs({
    sourceSpec: {
      content: JSON.stringify(clientSchema),
      location: 'local',
      format: 'openapi3',
    },
    destinationSpec: {
      content: JSON.stringify(serverSchema),
      location: 'local',
      format: 'openapi3',
    },
  });

  if (result.breakingDifferencesFound) {
    console.warn('Breaking change found!');
    console.warn(result);
    return false;
  }

  return true;
};

export default {
  forClientRequest,
  forURL,
  isCompatible,
};
