import { join, normalize } from 'path';
import { cwd } from 'process';
import provider from '../../src/openapi/provider';

describe('openapi.provider', () => {
  it('caches the schema', async () => {
    const host = 'railsSampleApp';
    const schemata = {
      railsSampleApp: `file://${normalize(
        join(cwd(), 'test', 'fixtures', 'schemata', 'railsSampleApp6thEd.openapiv3.yaml')
      )}`,
    };

    const schema1 = await provider(host, schemata);
    const schema2 = await provider(host, schemata);
    expect(Object.is(schema1, schema2)).toBeTruthy();
  });
});
