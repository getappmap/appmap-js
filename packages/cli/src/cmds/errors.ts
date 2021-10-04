import chalk from 'chalk';
import { prefixLines } from '../utils';
import AgentInstaller from './agentInstaller/agentInstaller';

export class InstallError {
  constructor(readonly error: unknown, readonly installer?: AgentInstaller) {}
}

export class AbortError extends Error {}
export class ValidationError extends Error {}
export class ChildProcessError extends Error {
  constructor(
    readonly command: string,
    readonly output: string,
    readonly code?: number | null
  ) {
    super(
      [
        `An error occurred while running the command: ${chalk.red(command)}\n`,
        code && `The command exited with code ${chalk.red(code)}\n`,
        output && prefixLines(output.trim(), chalk.red('>  ')),
      ]
        .filter(Boolean)
        .join('')
    );
  }
}
