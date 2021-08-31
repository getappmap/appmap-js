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

module.exports = CommandStruct;
