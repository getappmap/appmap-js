import provider from './provider';
import OpenApiDiff from 'openapi-diff';
import Model from './model';
import SecuritySchemes from './securitySchemes';
import { rpcRequestForEvent } from './rpcRequest';
import { Event } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';
import { writeFileSync } from 'fs';
import { verbose } from '../scanner/util';

interface OpenAPIV3Fragment {
  paths: OpenAPIV3.PathItemObject;
  securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>;
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

  return { paths: model.openapi(), securitySchemes: securitySchemes.openapi() };
};

const forURL = async (
  url: string,
  openapiSchemata: Record<string, string>
): Promise<OpenAPIV3.Document> => {
  return provider(url, openapiSchemata);
};

const breakingChanges = async (
  schemaHead: OpenAPIV3.Document,
  schemaBase: OpenAPIV3.Document
): Promise<Array<OpenApiDiff.DiffResult<'breaking'>>> => {
  if (verbose()) {
    writeFileSync('openapi_head.json', JSON.stringify(schemaHead, null, 2));
    writeFileSync('openapi_base.json', JSON.stringify(schemaBase, null, 2));
  }

  const result = await OpenApiDiff.diffSpecs({
    sourceSpec: {
      content: JSON.stringify(schemaHead),
      location: 'openapi_head.json',
      format: 'openapi3',
    },
    destinationSpec: {
      content: JSON.stringify(schemaBase),
      location: 'openapi_base.json',
      format: 'openapi3',
    },
  });

  if (result.breakingDifferencesFound) {
    return result.breakingDifferences;
  }

  return [];
};

export { forClientRequest, forURL, breakingChanges };
