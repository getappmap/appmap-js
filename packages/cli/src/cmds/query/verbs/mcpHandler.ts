import { createInterface } from 'readline';

import yargs from 'yargs';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { verbose } from '../../../utils';
import { LazyQueryDb } from '../lib/lazyQueryDb';
import {
  buildMcpHandler,
  JsonRpcRequest,
  JsonRpcResponse,
} from '../queries/mcp';
import type { Argv } from './mcp';

export default async function handler(argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> {
  const argv = argvIn as yargs.ArgumentsCamelCase<Argv>;
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);

  // Serve even when the index doesn't exist yet (e.g. the MCP is
  // configured before `appmap index` has run): tool calls report what's
  // missing and how to build it, and the DB is picked up once it appears.
  const queryDb = new LazyQueryDb({
    appmapDir: argv.appmapDir,
    queryDb: argv.queryDb,
    // Set by @yao-pkg/pkg in the native binary.
    executable: 'pkg' in process ? process.execPath : undefined,
  });
  await queryDb.refresh();
  const handle = buildMcpHandler(() => queryDb.get());

  // MCP transport: newline-delimited JSON-RPC 2.0 over stdio. Logging
  // goes to stderr only — anything on stdout corrupts the protocol stream.
  process.stderr.write(`appmap mcp listening on stdio\n`);
  try {
    queryDb.get();
  } catch (e) {
    process.stderr.write(`warning: ${(e as Error).message}\n`);
  }

  const rl = createInterface({ input: process.stdin });
  // refresh() is async, so chain messages to keep responses in order.
  let pending = Promise.resolve();
  rl.on('line', (line) => {
    pending = pending
      .then(() => handleLine(line))
      .catch((err: Error) => {
        process.stderr.write(`error: ${err.message}\n`);
      });
  });

  async function handleLine(line: string): Promise<void> {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;
    let msg: JsonRpcRequest;
    try {
      msg = JSON.parse(trimmed) as JsonRpcRequest;
    } catch (err) {
      writeResponse({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: `parse error: ${(err as Error).message}` },
      });
      return;
    }
    await queryDb.refresh();
    let response: JsonRpcResponse | null;
    try {
      response = handle(msg);
    } catch (err) {
      response = {
        jsonrpc: '2.0',
        id: msg.id ?? null,
        error: { code: -32603, message: (err as Error).message },
      };
    }
    if (response) writeResponse(response);
  }

  rl.on('close', () => {
    void pending.then(() => {
      queryDb.close();
      process.exit(0);
    });
  });
}

function writeResponse(response: JsonRpcResponse): void {
  process.stdout.write(`${JSON.stringify(response)}\n`);
}
