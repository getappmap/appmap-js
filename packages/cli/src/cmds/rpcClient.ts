import yargs from 'yargs';

import lazyHandler from '../lib/lazyHandler';
import { commonNavieArgsBuilder } from './navie/commonNavieArgs';

export const command = 'rpc-client <function> [request]';
export const describe = 'Invoke an RPC function without running the server';

export function builder<T>(args: yargs.Argv<T>) {
  return commonNavieArgsBuilder(args)
    .positional('function', {
      describe: 'RPC function name',
      type: 'string',
    })
    .positional('request', {
      describe: 'RPC request argument as JSON',
      type: 'string',
    })
    .option('input', {
      alias: 'i',
      describe: 'Input file',
      type: 'string',
    });
}

export type HandlerArguments = yargs.ArgumentsCamelCase<
  ReturnType<typeof builder> extends yargs.Argv<infer A> ? A : never
>;

export const handler = lazyHandler(() => import('./rpcClientHandler'));
