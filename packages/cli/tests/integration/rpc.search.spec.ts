import { SearchRpc } from '@appland/rpc';
import { join } from 'path';
import { readFile } from 'fs/promises';

import RPCTest from './RPCTest';
import { verbose } from '../../src/utils';

describe('RPC', () => {
  const rpcTest = new RPCTest();

  beforeAll(() => verbose(process.env.DEBUG === 'true'));
  beforeAll(async () => await rpcTest.setupAll());
  beforeEach(async () => await rpcTest.setupEach());
  afterEach(async () => await rpcTest.teardownEach());
  afterAll(async () => await rpcTest.teardownAll());

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
