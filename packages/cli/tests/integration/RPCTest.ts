import assert from 'assert';
import jayson from 'jayson/promise';
import { AppMapFilter, serializeFilter } from '@appland/models';
import { RPC, buildRPC } from './buildRPC';
import RPCServer from '../../src/cmds/index/rpcServer';
import { join } from 'path';
import { verbose } from '../../src/utils';

export default class RPCTest {
  workingDir = process.cwd();
  rpc: RPC | undefined;

  get server(): RPCServer {
    assert(this.rpc);
    return this.rpc.server;
  }

  get client(): jayson.Client {
    assert(this.rpc);
    return this.rpc.client;
  }

  async setup(): Promise<void> {
    process.chdir(join(__dirname, '../unit/fixtures/ruby'));

    if (process.env.VERBOSE === 'true') verbose(true);

    this.rpc = await buildRPC();
  }

  async teardown() {
    if (this.rpc) this.rpc.server.stop();

    process.chdir(this.workingDir);
  }

  hideExternalFilterState() {
    const filter = new AppMapFilter();
    filter.declutter.hideExternalPaths.on = true;
    return serializeFilter(filter);
  }
}
