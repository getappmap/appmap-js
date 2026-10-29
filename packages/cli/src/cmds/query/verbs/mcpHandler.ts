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

// How long the server may outlive its client's stdin; see exitIfStuck().
const EXIT_GRACE_MS = 5000;

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
  // A client that goes away with responses still queued makes the next
  // write fail with EPIPE. Stop answering and exit quietly instead of
  // crashing with an unhandled 'error' event.
  process.stdout.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code !== 'EPIPE') throw err;
    rl.close();
  });
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

  // Once the client closes stdin, finish pending messages and let the
  // process exit on its own, which also waits for stdout to flush. Nothing
  // else may keep the event loop alive; tests/unit/cmds/query/verbs/
  // mcpProcess.spec.ts checks that.
  rl.on('close', () => {
    void pending.then(() => {
      queryDb.close();
      // Responses a slow client hasn't read yet also hold the process open,
      // so only start counting once they're flushed: the callback of this
      // empty write runs after all earlier writes.
      if (process.stdout.writable) process.stdout.write('', exitIfStuck);
      else exitIfStuck();
    });
  });
}

// A safety net for a leaked handle, which would otherwise leave a server
// running behind every client that only closes stdin. It says what held
// the process open and exits with a failure, so the leak still shows up
// (and fails the test above) rather than being papered over. The timer is
// unref'd, so it never fires if the process can exit on its own.
function exitIfStuck(): void {
  setTimeout(() => {
    const resources = process.getActiveResourcesInfo().join(', ');
    process.stderr.write(
      `appmap mcp: still running ${EXIT_GRACE_MS / 1000}s after stdin closed; ` +
        `held open by: ${resources}\n`
    );
    process.exit(1);
  }, EXIT_GRACE_MS).unref();
}

function writeResponse(response: JsonRpcResponse): void {
  if (!process.stdout.writable) return; // the client is gone
  process.stdout.write(`${JSON.stringify(response)}\n`);
}
