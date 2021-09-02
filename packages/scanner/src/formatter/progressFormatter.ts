import Formatter from './formatter';
import Assertion from '../assertion';
import chalk from 'chalk';
import { AppMap } from '@appland/models';
import { AssertionFailure } from '../types';

export default class ProgressFormatter extends Formatter {
  appMap(appMap: AppMap): string {
    return '';
  }

  result(assertion: Assertion, failures: AssertionFailure[], index: number): string | undefined {
    const ending = index % 80 === 0 ? '\n' : '';

    if (failures.length === 0) {
      return chalk.green('.') + ending;
    } else {
      return chalk.red('F') + ending;
    }
  }
}
