import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';

export default async function collectRoutes(
  openapiFile: string,
  resourceTokens: number,
  routeCountByResource: Record<string, number>,
  routeCountByContentType: Record<string, number>
) {
  if (!existsSync(openapiFile)) return;

  const openapi: OpenAPIV3.Document = load(
    await readFile(openapiFile, 'utf-8')
  ) as OpenAPIV3.Document;
  for (const pattern of Object.keys(openapi.paths)) {
    const pathItem = openapi.paths[pattern];
    if (!pathItem) continue;

    for (const method of Object.values(OpenAPIV3.HttpMethods)) {
      const operation = pathItem[method];
      if (!operation) continue;

      const directoryIsh = pattern.split('/').slice(0, resourceTokens).join('/');
      if (!routeCountByResource[directoryIsh]) routeCountByResource[directoryIsh] = 1;
      else routeCountByResource[directoryIsh] = routeCountByResource[directoryIsh] + 1;

      for (const responseOption of Object.values(operation.responses)) {
        const response = responseOption as OpenAPIV3.ResponseObject;
        if (response.content) {
          for (const contentType of Object.keys(response.content)) {
            if (!routeCountByContentType[contentType]) routeCountByContentType[contentType] = 1;
            else routeCountByContentType[contentType] = routeCountByContentType[contentType] + 1;
          }
        }
      }
    }
  }
}
