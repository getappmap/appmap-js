import { credentials, ServerCredentials } from '@grpc/grpc-js';
import { join } from 'path';
import Server from '../../../../src/lib/server/appmapStaticServer';

import services from '../../../../static_codegen/protos/appmap_grpc_pb';
import messages from '../../../../static_codegen/protos/appmap_pb';

const APPMAP_DIR = 'tests/unit/fixtures/depends';

describe('AppMapService', () => {
  let serverInstance;
  let portNumber;

  beforeAll(async () => {
    serverInstance = Server();
    return new Promise((resolve, reject) => {
      serverInstance.bindAsync(
        `0.0.0.0:51001`,
        ServerCredentials.createInsecure(),
        (err, _portNumber) => {
          if (err) {
            return reject(err);
          }
          portNumber = _portNumber;
          serverInstance.start();
          resolve(serverInstance);
        }
      );
    });
  });

  afterAll(() => {
    if (serverInstance) {
      serverInstance.forceShutdown();
    }
  });

  test('indicates when no dependency is modified', async () => {
    const client = new services.AppMapServiceClient(
      `localhost:${portNumber}`,
      credentials.createInsecure()
    );

    const index = new messages.Index();
    index.setAppMapDir(APPMAP_DIR);
    const dependsParams = new messages.DependsParams();
    dependsParams.setFilesList(['app/models/user.rb']);
    dependsParams.setIndex(index);
    const call = client.depends(dependsParams);
    const result = [];
    return new Promise((resolve, reject) => {
      call.on('data', (appmap) => {
        result.push(appmap.getFileName());
      });
      call.on('end', (e) => {
        if (e) {
          return reject(e);
        }

        expect(result).toEqual([
          join(APPMAP_DIR, 'user_page_scenario.appmap.json'),
        ]);

        return resolve(e);
      });
    });
  });
});
