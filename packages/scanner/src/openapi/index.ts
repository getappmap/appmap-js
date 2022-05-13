import { writeFileSync } from 'fs';
import OpenApiDiff from 'openapi-diff';
import { OpenAPIV3 } from 'openapi-types';
import { verbose } from '../rules/lib/util';

export * from '@appland/openapi';

export const breakingChanges = async (
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
