import { PathLike } from 'fs';
import { env } from 'process';

export default class CommandStruct {
  readonly environment: NodeJS.ProcessEnv;

  constructor(
    readonly program: string,
    readonly args: readonly string[],
    readonly path: PathLike,
    environment: NodeJS.ProcessEnv = {}
  ) {
    this.environment = { ...env, ...environment };
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
