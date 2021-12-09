import Formatter from './formatter';
import chalk from 'chalk';
import { AppMap } from '@appland/models';
import { Finding } from '../types';
import Check from 'src/check';

export default class PrettyFormatter extends Formatter {
  appMap(appMap: AppMap): string {
    return '\n' + appMap.metadata.name + '\n';
  }

  result(check: Check, matches: Finding[]): string | undefined {
    const readableAssertion = [check.rule.id, check.rule.title].filter((d) => d).join(' ');

    if (matches.length === 0) {
      return '\t' + chalk.stderr.green(readableAssertion) + '\n';
    } else {
      return '\t' + chalk.stderr.magenta(readableAssertion) + '\n';
    }
  }
}
