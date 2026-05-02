import { createInterface } from 'readline';

import yargs from 'yargs';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import {
  buildMcpHandler,
  JsonRpcRequest,
  JsonRpcResponse,
} from '../queries/mcp';

export const command = 'mcp';
export const describe =
  'Run an MCP (Model Context Protocol) server on stdio that exposes the query verbs as tools';

export const builder = <T>(args: yargs.Argv<T>) => {
  return args
    .option('directory', { type: 'string', alias: 'd' })
    .option('appmap-dir', { type: 'string' })
    .option('query-db', {
      type: 'string',
      describe: 'path to query.db (overrides default)',
    });
};

type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Widened at the export so this module is assignable to CommandModule<T, any>.
export const handler = async (argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> => {
  const argv = argvIn as yargs.ArgumentsCamelCase<Argv>;
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);
  const appmapDir = argv.queryDb ? '' : await locateAppMapDir(argv.appmapDir);

  const db = openReadOnly(appmapDir, argv.queryDb);
  const handle = buildMcpHandler(db);

  // MCP transport: newline-delimited JSON-RPC 2.0 over stdio. Logging
  // goes to stderr only — anything on stdout corrupts the protocol stream.
  process.stderr.write(`appmap mcp listening on stdio\n`);

  const rl = createInterface({ input: process.stdin });
  rl.on('line', (line) => {
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
    let response: JsonRpcResponse | null;
    try {
      response = handle(msg);
    } catch (err) {
      response = {
        jsonrpc: '2.0',
        id: (msg.id ?? null) as string | number | null,
        error: { code: -32603, message: (err as Error).message },
      };
    }
    if (response) writeResponse(response);
  });

  rl.on('close', () => {
    db.close();
    process.exit(0);
  });
};

function writeResponse(response: JsonRpcResponse): void {
  process.stdout.write(`${JSON.stringify(response)}\n`);
}
