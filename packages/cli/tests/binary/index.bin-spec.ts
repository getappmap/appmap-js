import { ChildProcess } from 'node:child_process';
import { rm } from 'node:fs/promises';

import { retry } from 'async';

import { buildRubyProject, runInBackground, waitForStdout } from './helpers';
import { Client } from 'jayson/promise';
import { AppMapRpc } from '@appland/rpc';

describe('appmap', () => {
  let projectPath: string;

  describe('index', () => {
    beforeEach(async () => {
      projectPath = await buildRubyProject();
    });

    // Ensure backwards compatibility
    describe('--port (RPC server)', () => {
      let indexProcess: ChildProcess;
      let rpcClient: Client;

      beforeEach(async () => {
        indexProcess = runInBackground(['index', '-p', '0', '-d', projectPath]);
        const portStr = await waitForStdout(
          indexProcess,
          /Running JSON-RPC server on port: (\d+)/,
          20_000
        );
        rpcClient = Client.http({ port: parseInt(portStr, 10) });
      });

      afterEach(() => {
        indexProcess.kill();
        // remove the temporary project directory
        void rm(projectPath, { recursive: true });
      });

      const checkStats = async () => {
        const { error, result } = await rpcClient.request(AppMapRpc.Stats.V1.Method, {});
        expect(error).toBeUndefined();
        expect(result).toStrictEqual({
          packages: ['app/controllers', 'app/models', 'json'],
          classes: [
            'app/controllers/API::APIKeysController',
            'app/models/ApiKey',
            'json/JSON::Ext::Generator::State',
          ],
          routes: ['DELETE /api/api_keys'],
          tables: ['api_keys', 'pg_attribute', 'pg_type', 'users'],
          numAppMaps: 1,
        });
      };

      // it might take a moment for the maps to be indexed
      it('picks up the correct configuration', backoffRetry(checkStats));
    });
  });
});

function backoffRetry<T>(fn: () => Promise<T>, times = 10, initialDelay = 10): () => Promise<T> {
  const interval = (retryCount: number) => Math.pow(2, retryCount) * initialDelay;
  return () => retry({ times, interval }, fn);
}
