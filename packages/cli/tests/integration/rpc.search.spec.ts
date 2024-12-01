import { SearchRpc } from '@appland/rpc';
import { join, normalize } from 'path';
import { readFile } from 'fs/promises';

import { SingleDirectoryRPCTest as RPCTest } from './RPCTest';
import { verbose } from '../../src/utils';

describe('RPC', () => {
  const rpcTest = new RPCTest();

  beforeAll(() => verbose(process.env.DEBUG === 'true'));
  beforeAll(async () => await rpcTest.setupAll());
  beforeEach(async () => await rpcTest.setupEach());
  afterEach(async () => await rpcTest.teardownEach());
  afterAll(async () => await rpcTest.teardownAll());

  // Windows path separators will be escaped in JSON serialized form
  // $cwd is normalized
  // Result.score is rounded to 2 significant digits
  const cwd = process.cwd().replace(/\\/g, '\\\\');
  const normalizeSearchData = (searchData: SearchRpc.SearchResponse): SearchRpc.SearchResponse => {
    let normalizedData = JSON.parse(
      JSON.stringify(searchData).replaceAll(cwd, '$cwd').replace(/\\\\/g, '/')
    );
    normalizedData.results.forEach((result: SearchRpc.SearchResult) => {
      result.score = parseFloat(result.score.toPrecision(2));
    });
    return normalizedData;
  };

  const compareSearchData = async (searchData: SearchRpc.SearchResponse, fixtureName: string) => {
    const normalizedSearchData = normalizeSearchData(searchData);
    const fixtureData = normalizeSearchData(
      JSON.parse(
        await readFile(join(__dirname, 'fixtures', 'search', `${fixtureName}.search.json`), 'utf-8')
      )
    );
    expect(normalizedSearchData).toEqual(fixtureData);
  };

  describe('search', () => {
    it('finds AppMaps by keyword', async () => {
      const options: SearchRpc.SearchOptions = {
        query: 'api key',
        maxResults: 3,
      };
      const response = await rpcTest.client.request(SearchRpc.FunctionName, options);
      expect(response.error).toBeFalsy();
      compareSearchData(response.result, 'api_key');
    });

    it('returns multiple AppMaps', async () => {
      const options: SearchRpc.SearchOptions = {
        query: 'api controller',
        maxResults: 3,
      };
      const response = await rpcTest.client.request(SearchRpc.FunctionName, options);
      expect(response.error).toBeFalsy();
      compareSearchData(response.result, 'multiple_results');
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
      compareSearchData(searchData, 'specific_appmaps');
    });
  });
});
