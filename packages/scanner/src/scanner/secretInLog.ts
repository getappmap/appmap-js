import { Event, ParameterObject } from '@appland/models';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MatchResult } from 'src/types';
import Assertion from '../assertion';
import { verbose, emptyValue } from './util';

const regexData: { [key: string]: string | string[] } = JSON.parse(
  readFileSync(join(__dirname, 'secretsRegexes.json')).toString()
);
const REGEXES: { [key: string]: RegExp[] } = Object.keys(regexData).reduce((memo, key) => {
  const value = regexData[key];
  const regexes = Array.isArray(value) ? value : [value];
  memo[key] = regexes.map((regex) => new RegExp(regex));
  return memo;
}, {} as { [key: string]: RegExp[] });

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
  const matches: Match[] = Object.keys(REGEXES).reduce((memo, key) => {
    const matches = findMatchingValue(REGEXES[key], e.parameters!);
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

const recordSecrets = (e: Event) => {
  if (emptyValue(e.returnValue.value)) {
    return;
  }
  if (verbose()) {
    console.warn(`Secret generated: ${e.returnValue.value}`);
  }
  secrets.add(e.returnValue.value);
};

const scanner = function (): Assertion {
  return Assertion.assert(
    'secret-in-log',
    'Secret in log',
    'event',
    (e: Event) => {
      if (e.codeObject.labels.has('secret.generator')) {
        recordSecrets(e);
      }
      if (e.parameters && e.codeObject.labels.has('log')) {
        return findInLog(e);
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        e.codeObject.labels.has('log') || e.codeObject.labels.has('secret.generator');
      assertion.description = `Log contains secret-like text`;
    }
  );
};

export default { scanner };
