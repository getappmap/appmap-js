import { AppMapRpc } from '@appland/rpc';
import { join } from 'path';
import { readFile } from 'fs/promises';

import RPCTest from './RPCTest';

describe('RPC', () => {
  const rpcTest = new RPCTest();

  beforeAll(async () => await rpcTest.setup());
  afterAll(() => rpcTest.teardown());

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
      expect(diagramData).toEqual(
        await readFile(
          join(__dirname, 'fixtures', 'sequenceDiagram', 'diagram.filtered.uml'),
          'utf-8'
        )
      );
    });
  });
});
