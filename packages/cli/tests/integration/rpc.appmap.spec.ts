import { AppMapRpc } from '@appland/rpc';
import { join } from 'path';
import { readFile } from 'fs/promises';

import { SingleDirectoryRPCTest as RPCTest } from './RPCTest';

describe('RPC', () => {
  const rpcTest = new RPCTest();

  beforeAll(async () => await rpcTest.setupAll());
  beforeEach(async () => await rpcTest.setupEach());
  afterEach(async () => await rpcTest.teardownEach());
  afterAll(async () => await rpcTest.teardownAll());

  describe('v1.appmap.stats', () => {
    it('can be retrieved', async () => {
      const response = await rpcTest.client.request(AppMapRpc.Stats.V1.Method, {});
      expect(response.error).toBeFalsy();
      expect(response.result).toStrictEqual({
        packages: ['app/controllers', 'app/models', 'json', 'openssl'],
        classes: [
          'app/controllers/API::APIKeysController',
          'app/controllers/OrganizationsController',
          'app/models/ApiKey',
          'app/models/Configuration',
          'app/models/User',
          'app/models/User::Show',
          'json/JSON::Ext::Generator::State',
          'json/JSON::Ext::Parser',
          'openssl/Digest::Instance',
          'openssl/OpenSSL::Cipher',
        ],
        routes: ['DELETE /api/api_keys', 'GET /organizations/new'],
        tables: ['api_keys', 'pg_attribute', 'pg_type', 'users'],
        numAppMaps: 2,
      });
    });
  });

  describe('v2.appmap.stats', () => {
    it('can be retrieved', async () => {
      const response = await rpcTest.client.request(AppMapRpc.Stats.V2.Method, {});
      expect(response.error).toBeFalsy();
      expect(response.result).toStrictEqual([
        {
          name: 'fixture-config',
          packages: ['app/controllers', 'app/models', 'json', 'openssl'],
          classes: [
            'app/controllers/API::APIKeysController',
            'app/controllers/OrganizationsController',
            'app/models/ApiKey',
            'app/models/Configuration',
            'app/models/User',
            'app/models/User::Show',
            'json/JSON::Ext::Generator::State',
            'json/JSON::Ext::Parser',
            'openssl/Digest::Instance',
            'openssl/OpenSSL::Cipher',
          ],
          routes: ['DELETE /api/api_keys', 'GET /organizations/new'],
          tables: ['api_keys', 'pg_attribute', 'pg_type', 'users'],
          numAppMaps: 2,
        },
      ]);
    });
  });

  describe('appmap.metadata', () => {
    it('can be retrieved', async () => {
      const options: AppMapRpc.MetadataOptions = {
        appmap: 'revoke_api_key.appmap.json',
      };
      const response = await rpcTest.client.request(AppMapRpc.MetadataFunctionName, options);
      expect(response.error).toBeFalsy();
      const metadata = response.result;
      expect(metadata.name).toEqual('API::APIKeysController revoke an existing api key');
    });
  });

  describe('appmap.data', () => {
    const eventCount = 42;
    const filteredEventCount = 40;

    it('can be retrieved', async () => {
      const options: AppMapRpc.FilterOptions = {
        appmap: 'revoke_api_key.appmap.json',
      };
      const response = await rpcTest.client.request(AppMapRpc.DataFunctionName, options);
      expect(response.error).toBeFalsy();
      const data = response.result;
      expect(data.metadata.name).toEqual('API::APIKeysController revoke an existing api key');
      expect(data.events.length).toEqual(eventCount);
    });

    it('can be filtered', async () => {
      const options: AppMapRpc.FilterOptions = {
        appmap: 'revoke_api_key.appmap.json',
        filter: rpcTest.hideExternalFilterState(),
      };
      const response = await rpcTest.client.request(AppMapRpc.DataFunctionName, options);
      expect(response.error).toBeFalsy();
      const data = response.result;
      expect(data.events.length).toEqual(filteredEventCount);
    });
  });

  describe('appmap.sequenceDiagram', () => {
    it('can be retrieved', async () => {
      const options: AppMapRpc.SequenceDiagramOptions = {
        appmap: 'revoke_api_key.appmap.json',
      };
      const response = await rpcTest.client.request(AppMapRpc.SequenceDiagramFunctionName, options);
      expect(response.error).toBeFalsy();
      const diagramData = response.result;
      expect(diagramData).toEqual(
        JSON.parse(
          await readFile(join(__dirname, 'fixtures', 'sequenceDiagram', 'diagram.json'), 'utf-8')
        )
      );
    });

    it('can be filtered', async () => {
      const options: AppMapRpc.SequenceDiagramOptions = {
        appmap: 'revoke_api_key.appmap.json',
        filter: rpcTest.hideExternalFilterState(),
        diagramOptions: { loops: false },
        format: 'plantuml',
        formatOptions: { disableMarkup: true },
      };
      const response = await rpcTest.client.request(AppMapRpc.SequenceDiagramFunctionName, options);
      expect(response.error).toBeFalsy();
      const diagramData = response.result;
      expect(diagramData.replace(/\r/g, '')).toEqual(
        (
          await readFile(
            join(__dirname, 'fixtures', 'sequenceDiagram', 'diagram.filtered.uml'),
            'utf-8'
          )
        ).replace(/\r/g, '')
      );
    });
  });
});
