import Formatter from './formatter';
import Assertion from '../assertion';
import chalk from 'chalk';
import { AppMapData } from '../../../appland/types';

export default class PrettyFormatter extends Formatter {
  appMap(appMap: AppMapData): string {
    return '\n' + appMap.metadata.name + '\n';
  }

  result(
    assertion: Assertion,
    result: boolean | null,
    index: number
  ): string | undefined {
    const readableAssertion = assertion.toString();

    if (result === true) {
      return '\t' + chalk.green(readableAssertion) + '\n';
    }

    if (result === false) {
      return '\t' + chalk.red(readableAssertion) + '\n';
    }
  }
}
