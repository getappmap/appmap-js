import { PathLike } from 'fs';
import { env } from 'process';

export default class CommandStruct {
  readonly environment: NodeJS.ProcessEnv;
  readonly args: string[];

  constructor(
    readonly program: string,
    args: readonly string[],
    readonly path: PathLike,
    environment: NodeJS.ProcessEnv = {}
  ) {
    this.environment = { ...env, ...environment };
    this.args = args.map((a) => {
      if (!a.includes(' ')) {
        return a;
      }

      // There shouldn't be a need to embed quotes, so raise an error if the caller tries.
      if (a.includes('"')) {
        throw new Error("Don't embed quotes in args");
      }
      return `"${a}"`;
    });
  }

  toString() {
    return [this.program].concat(this.args).join(' ');
  }
}

export interface CommandReturn {
  stdout: string;
  stderr: string;
}

/**
 * A simplified interface where stdout/stderr are handled as a single string, with a flag indicating
 * if the command succeeded or not.
 */
export interface CommandOutput {
  output: string;
  ok?: boolean;
}
