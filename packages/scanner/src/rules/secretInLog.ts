import { Event, ParameterObject } from '@appland/models';
import { MatchResult, Rule, RuleLogic } from 'src/types';
import SecretsRegexes from '../analyzer/secretsRegexes';
import { emptyValue } from './util';
import recordSecrets from '../analyzer/recordSecrets';

class Match {
  constructor(public regexp: RegExp | string, public value: string) {}
}

const secrets: Set<string> = new Set();

const findMatchingValue = (regexps: RegExp[], parameters: readonly ParameterObject[]): Match[] => {
  const matches: Match[] = [];
  parameters
    .filter((parameter) => !emptyValue(parameter.value))
    .forEach((parameter) => {
      const value = parameter.value;
      regexps
        .filter((regexp) => regexp.test(value))
        .forEach((regexp) => {
          matches.push(new Match(regexp, value));
        });
    });
  return matches;
};

const findInLog = (e: Event): MatchResult[] | undefined => {
  const matches: Match[] = Object.keys(SecretsRegexes).reduce((memo, key) => {
    const matches = findMatchingValue(SecretsRegexes[key], e.parameters!);
    matches.forEach((match) => memo.push(match));
    return memo;
  }, [] as Match[]);

  e.parameters!.filter((parameter) => !emptyValue(parameter.value)).forEach((parameter) => {
    const value = parameter.value;
    secrets.forEach((secret) => {
      if (value.includes(secret)) {
        matches.push(new Match(secret, value));
      }
    });
  });

  if (matches.length > 0) {
    return matches.map((match) => ({
      level: 'error',
      message: `${match.value} contains secret ${match.regexp}`,
    }));
  }
};

function build(): RuleLogic {
  return {
    matcher: (e) => {
      if (e.codeObject.labels.has(Secret)) {
        recordSecrets(secrets, e);
      }
      if (e.parameters && e.codeObject.labels.has(Log)) {
        return findInLog(e);
      }
    },
    where: (e) => {
      return e.codeObject.labels.has(Log) || e.codeObject.labels.has(Secret);
    },
  };
}

const Secret = 'secret';
const Log = 'log';

export default {
  id: 'secret-in-log',
  title: 'Secret in log',
  labels: [Secret, Log],
  enumerateScope: true,
  build,
} as Rule;
