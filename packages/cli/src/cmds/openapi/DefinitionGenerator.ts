import { Model, SecuritySchemes } from '@appland/openapi';
import { OpenAPIV3 } from 'openapi-types';
import DataStore from './DataStore';
import { readFile } from 'fs/promises';
import assert from 'assert';
import { headerValue } from '@appland/openapi/dist/rpcRequest';

export default class DefinitionGenerator {
  constructor(public dataStore: DataStore) {}

  async generate(): Promise<{
    warnings: Record<string, string[]>;
    paths: OpenAPIV3.PathsObject;
    securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>;
  }> {
    const securitySchemes = new SecuritySchemes();
    const paths: Record<string, OpenAPIV3.PathItemObject> = {};
    const warnings: Record<string, string[]> = {};
    const warningStrings = new Set<string>();

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

      const collectedWarnings = model.collectWarnings();
      for (const key of Object.keys(collectedWarnings)) {
        if (!warnings[key]) warnings[key] = [];
        for (const warning of collectedWarnings[key]) {
          const warningString = [key, warning].join(':');
          if (!warningStrings.has(warningString)) {
            warningStrings.add(warningString);

            console.warn(`OpenAPI warning generating ${key}: ${warning}`);
            warnings[key].push(warning);
          }
        }
      }
    }
    return {
      warnings,
      paths: Object.keys(paths)
        .sort()
        .reduce((memo, path) => ((memo[path] = paths[path]), memo), {}),
      securitySchemes: securitySchemes.openapi(),
    };
  }
}
