import chalk from 'chalk';
import { prefixLines } from '../utils';

export class InvalidPathError extends Error {
  constructor(readonly message: string, readonly path?: string) {
    super(message);
  }
}

export class AbortError extends Error {}
export class ValidationError extends Error {}
export class UserConfigError extends Error {}

export interface HttpErrorResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  toString(): string;
}

export class HttpError extends Error {
  constructor(message: string, readonly response?: HttpErrorResponse) {
    super(message);
  }
}

export class ChildProcessError extends Error {
  constructor(readonly command: string, readonly output: string, readonly code?: number | null) {
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
