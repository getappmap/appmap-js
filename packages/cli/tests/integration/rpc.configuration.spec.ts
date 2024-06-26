import { ConfigurationRpc } from '@appland/rpc';
import { join, resolve } from 'path';

import { SingleDirectoryRPCTest as RPCTest } from './RPCTest';
import configuration from '../../src/rpc/configuration';

describe('RPC', () => {
  const rpcTest = new RPCTest();

  beforeAll(() => rpcTest.setupAll());
  beforeEach(() => rpcTest.setupEach());
  afterEach(() => rpcTest.teardownEach());
  afterAll(() => rpcTest.teardownAll());

  describe('V1.Configuration', () => {
    describe('Get', () => {
      it('returns the configuration', async () => {
        const response = await rpcTest.client.request(ConfigurationRpc.V1.Get.Method, {});
        expect(response.error).toBeFalsy();
        expect(response.result).toStrictEqual({
          appmapConfigFiles: [resolve(join(__dirname, '../unit/fixtures/ruby/appmap.yml'))],
        });
      });
    });

    describe('Set', () => {
      it('sets the configuration', async () => {
        const params: ConfigurationRpc.V1.Set.Params = {
          appmapConfigFiles: ['/example/appmap.yml'],
        };
        const response = await rpcTest.client.request(ConfigurationRpc.V1.Set.Method, params);
        expect(response.error).toBeFalsy();
        expect(response.result).toBeNull();
        expect(configuration().appmapConfigFilePaths).toStrictEqual(params.appmapConfigFiles);
      });
    });
  });
});
