import chalk from 'chalk';
import { Finding } from '../types';

export default function (matches: Finding[]): string {
  if (matches.length === 0) {
    return chalk.stderr.green('.');
  } else {
    return chalk.stderr.magenta('!');
  }
}
