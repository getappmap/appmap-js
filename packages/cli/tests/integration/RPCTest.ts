import assert from 'assert';
import glob from 'glob';
import jayson from 'jayson/promise';
import { AppMapFilter, serializeFilter } from '@appland/models';
import { RPC, buildRPC } from './buildRPC';
import RPCServer from '../../src/cmds/index/rpcServer';
import { join } from 'path';
import { verbose } from '../../src/utils';
import FingerprintDirectoryCommand from '../../src/fingerprint/fingerprintDirectoryCommand';
import { promisify } from 'util';
import { rm } from 'fs/promises';

export default class RPCTest {
  workingDir = process.cwd();
  rpc: RPC | undefined;
  appmaps: string[] | undefined;

  get server(): RPCServer {
    assert(this.rpc);
    return this.rpc.server;
  }

  get client(): jayson.Client {
    assert(this.rpc);
    return this.rpc.client;
  }

  async setupAll() {
    if (process.env.VERBOSE === 'true') verbose(true);

    this.rpc = await buildRPC();
    // We will stop the server in teardownAll, but let's unref it anyway in case that doesn't happen.
    this.rpc.server.unref();
  }

  async setupEach() {
    process.chdir(join(__dirname, '../unit/fixtures/ruby'));

    await rm('appmap.index.json', { force: true });

    // Index the AppMaps because RPC commands will be expecting these files.
    this.appmaps = await promisify(glob)('*.appmap.json');
    const cmd = new FingerprintDirectoryCommand('.');
    await cmd.execute();
  }

  async teardownAll() {
    if (this.rpc) this.rpc.server.stop();
  }

  async teardownEach() {
    // Leave no trace of indexes, to avoid interfering with other tests.
    if (this.appmaps) {
      for (const appmap of this.appmaps) {
        const appmapId = appmap.slice(0, -'.appmap.json'.length);
        await rm(appmapId, { recursive: true, force: true });
      }
    }

    process.chdir(this.workingDir);
  }

  hideExternalFilterState() {
    const filter = new AppMapFilter();
    filter.declutter.hideExternalPaths.on = true;
    return serializeFilter(filter);
  }
}
