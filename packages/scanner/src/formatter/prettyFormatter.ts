import Formatter from './formatter';
import chalk from 'chalk';
import { AppMap } from '@appland/models';
import { AssertionPrototype, Finding } from '../types';

export default class PrettyFormatter extends Formatter {
  appMap(appMap: AppMap): string {
    return '\n' + appMap.metadata.name + '\n';
  }

  result(assertionPrototype: AssertionPrototype, matches: Finding[]): string | undefined {
    const readableAssertion = [assertionPrototype.config.id, assertionPrototype.config.description]
      .filter((d) => d)
      .join(' ');

    if (matches.length === 0) {
      return '\t' + chalk.stderr.green(readableAssertion) + '\n';
    } else {
      return '\t' + chalk.stderr.magenta(readableAssertion) + '\n';
    }
  }
}
