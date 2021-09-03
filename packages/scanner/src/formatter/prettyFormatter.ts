import Formatter from './formatter';
import Assertion from '../assertion';
import chalk from 'chalk';
import { AppMap } from '@appland/models';
import { AssertionFailure } from '../types';

export default class PrettyFormatter extends Formatter {
  appMap(appMap: AppMap): string {
    return '\n' + appMap.metadata.name + '\n';
  }

  result(assertion: Assertion, failures: AssertionFailure[]): string | undefined {
    const readableAssertion = assertion.toString();

    if (failures.length === 0) {
      return '\t' + chalk.green(readableAssertion) + '\n';
    } else {
      return '\t' + chalk.red(readableAssertion) + '\n';
    }
  }
}
