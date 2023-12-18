import { SearchRpc } from '@appland/rpc';
import { join } from 'path';
import { readFile } from 'fs/promises';

import RPCTest from './RPCTest';

describe('RPC', () => {
  const rpcTest = new RPCTest();

  beforeAll(async () => await rpcTest.setup());
  afterAll(() => rpcTest.teardown());

  describe('search', () => {
    it('finds AppMaps by keyword', async () => {
      const options: SearchRpc.SearchOptions = {
        query: 'api key',
        maxResults: 3,
      };
      const response = await rpcTest.client.request(SearchRpc.FunctionName, options);
      expect(response.error).toBeFalsy();
      const searchData = response.result;
      expect(searchData).toEqual(
        JSON.parse(
          await readFile(join(__dirname, 'fixtures', 'search', 'api_key.search.json'), 'utf-8')
        )
      );
    });
  });
});
