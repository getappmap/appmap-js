import yargs from 'yargs';

import lazyHandler from '../../lib/lazyHandler';
import { commonNavieArgsBuilder as navieBuilder } from '../navie/commonNavieArgs';

export const command = 'rpc';
export const describe = 'Run AppMap JSON-RPC server';

export const builder = <T>(args: yargs.Argv<T>) => {
  return navieBuilder(args)
    .option('port', {
      describe:
        'port to listen on for JSON-RPC requests. Use port 0 to let the OS choose a port. The port number will be printed to stdout on startup.',
      type: 'number',
      alias: 'p',
      default: 0,
    })
    .strict();
};

type GetArgv<T> = T extends yargs.Argv<infer A> ? A : never;
export type HandlerArguments = yargs.ArgumentsCamelCase<
  GetArgv<ReturnType<typeof builder>> & { verbose?: boolean }
>;

export const handler = lazyHandler(() => import('./rpcHandler'));
