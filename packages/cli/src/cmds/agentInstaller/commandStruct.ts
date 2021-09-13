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

export type CommandReturn = {
  stdout: string;
  stderr: string;
};

module.exports = CommandStruct;
