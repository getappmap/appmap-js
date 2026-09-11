import yargs from 'yargs';

import lazyHandler from '../lib/lazyHandler';
import { commonNavieArgsBuilder } from './navie/commonNavieArgs';

export const command = 'navie [question..]';
export const describe = 'Explain a question using Navie';

export function builder<T>(args: yargs.Argv<T>) {
  return commonNavieArgsBuilder(args)
    .positional('question', {
      describe: 'Question text; appended to any other input',
      type: 'string',
      array: true,
    })
    .option('output', {
      describe: 'Output path',
      type: 'string',
      alias: 'o',
    })
    .option('input', {
      describe: 'Input path',
      type: 'string',
      alias: 'i',
    })
    .option('code-selection', {
      describe: 'Code selection path',
      type: 'string',
      alias: 'c',
    });
}

export type HandlerArguments = yargs.ArgumentsCamelCase<
  ReturnType<typeof builder> extends yargs.Argv<infer A> ? A : never
>;

export const handler = lazyHandler(() => import('./navieHandler'));
