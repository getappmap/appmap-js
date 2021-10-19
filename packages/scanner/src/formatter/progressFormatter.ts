import Formatter from './formatter';
import chalk from 'chalk';
import { AssertionPrototype, Finding } from '../types';

export default class ProgressFormatter extends Formatter {
  appMap(): string {
    return '';
  }

  result(
    _assertionPrototype: AssertionPrototype,
    matches: Finding[],
    index: number
  ): string | undefined {
    const ending = index % 80 === 0 ? '\n' : '';

    if (matches.length === 0) {
      return chalk.stderr.green('.') + ending;
    } else {
      return chalk.stderr.magenta('!') + ending;
    }
  }
}
