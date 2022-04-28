import chalk from 'chalk';
import { PathLike, constants as fsConstants } from 'fs';
import { access } from 'fs/promises';
import { ValidationError } from '../errors';

export default async function (kind: string, path: string): Promise<void> {
  try {
    await access(path as PathLike, fsConstants.R_OK);
  } catch {
    throw new ValidationError(
      `AppMap ${kind} ${chalk.red(path)} does not exist, or is not readable.`
    );
  }
}
