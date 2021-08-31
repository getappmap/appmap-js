import Formatter from './formatter';
import Assertion from '../assertion';
import chalk from 'chalk';
import { AppMapData } from '../../../appland/types';

export default class ProgressFormatter extends Formatter {
  appMap(appMap: AppMapData): string {
    return '';
  }

  result(
    assertion: Assertion,
    result: Boolean | null,
    index: number
  ): string | undefined {
    const ending = index % 80 === 0 ? '\n' : '';

    if (result === true) {
      return chalk.green('.') + ending;
    }

    if (result === false) {
      return chalk.red('F') + ending;
    }
  }
}
