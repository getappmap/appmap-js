import Formatter from './formatter';
import Assertion from '../assertion';
import chalk from 'chalk';
import { AppMap } from '@appland/models';
import { Finding } from '../types';

export default class PrettyFormatter extends Formatter {
  appMap(appMap: AppMap): string {
    return '\n' + appMap.metadata.name + '\n';
  }

  result(assertion: Assertion, matches: Finding[]): string | undefined {
    const readableAssertion = assertion.toString();

    if (matches.length === 0) {
      return '\t' + chalk.stderr.green(readableAssertion) + '\n';
    } else {
      return '\t' + chalk.stderr.magenta(readableAssertion) + '\n';
    }
  }
}
