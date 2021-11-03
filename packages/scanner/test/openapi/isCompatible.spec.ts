import { forClientRequest, breakingChanges } from '../../src/openapi/index';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { load } from 'js-yaml';
import { httpClientRequests } from './util';
import { OpenAPIV3 } from 'openapi-types';

describe('openapi.isCompatible', () => {
  it('incompatible request', async () => {
    const postTokenRequest = httpClientRequests[0]!;
    const clientFragment = forClientRequest(postTokenRequest);

    expect(clientFragment).toBeTruthy();

    const serverSchema = load(
      (
        await readFile(
          join(__dirname, '..', 'fixtures', 'schemata', 'railsSampleApp6thEd.openapiv3.yaml')
        )
      ).toString()
    ) as OpenAPIV3.Document;
    const clientSchema = {
      openapi: '3.0.0',
      info: {
        title: 'Schema derived from client request',
        version: serverSchema.info.version, // Indicate that it *should* be compatible.
      },
      paths: clientFragment!.paths,
      components: { securitySchemes: clientFragment!.securitySchemes },
    } as OpenAPIV3.Document;
    const changes = await breakingChanges(clientSchema, serverSchema);
    expect(changes).toHaveLength(1);

    const change = changes[0];
    expect(change.action).toEqual('remove');
    expect(change.code).toEqual('path.remove');
    expect(change.sourceSpecEntityDetails).toHaveLength(1);
    expect(change.sourceSpecEntityDetails[0].location).toEqual('paths./v1/tokens');
  });
});
