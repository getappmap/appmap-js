import assert from 'assert';
import glob from 'glob';
import jayson from 'jayson/promise';
import { rm } from 'fs/promises';
import { AppMapFilter, serializeFilter } from '@appland/models';
import { join } from 'path';
import { promisify } from 'util';

import { RPC, buildRPC } from './buildRPC';
import RPCServer from '../../src/cmds/index/rpcServer';
import { verbose } from '../../src/utils';
import FingerprintDirectoryCommand from '../../src/fingerprint/fingerprintDirectoryCommand';
import { INavieProvider } from '../../src/rpc/explain/navie/inavie';
import { configureRpcDirectories } from '../../src/lib/handleWorkingDirectory';

export default abstract class RPCTest {
  public navieProvider: INavieProvider;

  restoreDirectory = process.cwd();
  rpc: RPC | undefined;
  appmaps: string[] | undefined;

  // workingDir is needed because some RPC functions (may?) depend on the working directory.
  // Let's work to phase this out.
  constructor(public workingDir: string, navieProvider?: INavieProvider) {
    this.navieProvider =
      navieProvider ||
      ({
        ask: jest
          .fn()
          .mockRejectedValue(
            new Error(
              `Unexpected call to Navie 'ask'. Did you mean to provide an INavieProvider to RPCTest?`
            )
          ),
      } as unknown as INavieProvider);
  }

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

    this.rpc = await buildRPC(this.navieProvider);
    // We will stop the server in teardownAll, but let's unref it anyway in case that doesn't happen.
    this.rpc.server.unref();
  }

  async setupEach() {
    process.chdir(this.workingDir);
    configureRpcDirectories(this.directories);

    this.appmaps = new Array<string>();
    for ( const dir of this.directories ) {
      // Index the AppMaps because RPC commands will be expecting these files.
      this.appmaps.concat(...await promisify(glob)(`${dir}/**/*.appmap.json`))
      const cmd = new FingerprintDirectoryCommand(dir);
      await cmd.execute();
    }
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

    configureRpcDirectories([]);

    const cwd = process.cwd();
    if (cwd !== this.workingDir) {
      // Ultimately, it would be nice to avoid having any dependency on the working directory
      // in the RPC server, and go strictly by the RPC function arguments and/or the server configuration.
      console.log(`RPCTest: Restoring working directory to ${this.workingDir}`);
      process.chdir(this.workingDir);
    }
  }

  hideExternalFilterState() {
    const filter = new AppMapFilter();
    filter.declutter.hideExternalPaths.on = true;
    return serializeFilter(filter);
  }

  abstract get directories(): string[];
}

export const DEFAULT_WORKING_DIR = join(__dirname, '../unit/fixtures/ruby');

export class SingleDirectoryRPCTest extends RPCTest {

  constructor(public workingDir = DEFAULT_WORKING_DIR, navieProvider?: INavieProvider) {
    super(workingDir, navieProvider);
  }

  get directories() {
    return [this.workingDir];
  }
}

export class MultiDirectoryRPCTest extends RPCTest {
  constructor(public workingDir: string, public directories: string[], navieProvider?: INavieProvider) {
    super(workingDir, navieProvider);
  }
}
