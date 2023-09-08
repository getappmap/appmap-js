import { Model, SecuritySchemes } from '@appland/openapi';
import { OpenAPIV3 } from 'openapi-types';
import DataStore from './DataStore';
import { readFile } from 'fs/promises';
import assert from 'assert';
import { headerValue } from '@appland/openapi/dist/rpcRequest';

export default class DefinitionGenerator {
  constructor(public dataStore: DataStore) {}

  async generate(): Promise<{
    paths: OpenAPIV3.PathsObject;
    securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>;
  }> {
    const securitySchemes = new SecuritySchemes();
    const paths: Record<string, OpenAPIV3.PathItemObject> = {};

    for (const requestFileName of this.dataStore.requestFileNames) {
      let requestData: any[];
      try {
        requestData = JSON.parse(await readFile(requestFileName, 'utf-8'));
      } catch (e) {
        console.warn(`Warning: unable to parse AppMap ${requestFileName}: ${e}`);
        continue;
      }
      assert(requestData);
      const model = new Model();
      for (const request of requestData) {
        model.addRpcRequest(request);
        if (request.requestHeaders) {
          const authorizationHeader = headerValue(request.requestHeaders, 'Authorization');
          if (authorizationHeader) securitySchemes.addAuthorizationHeader(authorizationHeader);
        }
      }

      const openapi = model.openapi();
      for (const [path, pathItem] of Object.entries(openapi)) {
        if (pathItem) paths[path] = pathItem;
      }
      for (const error of model.errors) {
        console.warn(`Warning: ${error}`);
      }
    }
    return {
      paths: Object.keys(paths)
        .sort()
        .reduce((memo, path) => ((memo[path] = paths[path]), memo), {}),
      securitySchemes: securitySchemes.openapi(),
    };
  }
}
