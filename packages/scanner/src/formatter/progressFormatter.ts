import Formatter from './formatter';
import chalk from 'chalk';
import { Finding } from '../types';
import Check from 'src/check';

export default class ProgressFormatter extends Formatter {
  appMap(): string {
    return '';
  }

  result(_check: Check, matches: Finding[]): string | undefined {
    if (matches.length === 0) {
      return chalk.stderr.green('.');
    } else {
      return chalk.stderr.magenta('!');
    }
  }
}
