import Formatter from './formatter';
import Assertion from '../assertion';
import chalk from 'chalk';
import { Finding } from '../types';

export default class ProgressFormatter extends Formatter {
  appMap(): string {
    return '';
  }

  result(_assertion: Assertion, matches: Finding[], index: number): string | undefined {
    const ending = index % 80 === 0 ? '\n' : '';

    if (matches.length === 0) {
      return chalk.green('.') + ending;
    } else {
      return chalk.magenta('M') + ending;
    }
  }
}
