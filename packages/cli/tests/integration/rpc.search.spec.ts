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

  const normalizeSearchData = (searchData: SearchRpc.SearchResponse): SearchRpc.SearchResponse =>
    JSON.parse(JSON.stringify(searchData).replaceAll(process.cwd(), "$cwd"));

  describe('search', () => {
    it('finds AppMaps by keyword', async () => {
      const options: SearchRpc.SearchOptions = {
        query: 'api key',
        maxResults: 3,
      };
      const response = await rpcTest.client.request(SearchRpc.FunctionName, options);
      expect(response.error).toBeFalsy();
      const searchData = response.result;
      expect(normalizeSearchData(searchData)).toEqual(
        JSON.parse(
          await readFile(join(__dirname, 'fixtures', 'search', 'api_key.search.json'), 'utf-8')
        )
      );
    });

    it('returns multiple AppMaps', async () => {
      const options: SearchRpc.SearchOptions = {
        query: 'controller',
        maxResults: 3,
      };
      const response = await rpcTest.client.request(SearchRpc.FunctionName, options);
      expect(response.error).toBeFalsy();
      const searchData = response.result;
      expect(normalizeSearchData(searchData)).toEqual(
        JSON.parse(
          await readFile(
            join(__dirname, 'fixtures', 'search', 'multiple_results.search.json'),
            'utf-8'
          )
        )
      );
    });

    it('can be limited to a specific AppMap', async () => {
      const options: SearchRpc.SearchOptions = {
        query: 'controller',
        maxResults: 3,
        appmaps: ['user_page_scenario'],
      };
      const response = await rpcTest.client.request(SearchRpc.FunctionName, options);
      expect(response.error).toBeFalsy();
      const searchData = response.result;
      expect(normalizeSearchData(searchData)).toEqual(
        JSON.parse(
          await readFile(
            join(__dirname, 'fixtures', 'search', 'specific_appmaps.search.json'),
            'utf-8'
          )
        )
      );
    });
  });
});
