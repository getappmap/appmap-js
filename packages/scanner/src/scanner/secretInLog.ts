import { Event, ParameterObject } from '@appland/models';
import { readFileSync } from 'fs';
import { join } from 'path';
import Assertion from '../assertion';

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
  constructor(public regexp: RegExp, public value: string) {}
}

const findMatchingValue = (
  regexps: RegExp[],
  parameters: readonly ParameterObject[]
): Match | null => {
  let match: Match | null = null;
  for (let i = 0; match === null && i < regexps.length; i++) {
    const regexp = regexps[i];
    for (let j = 0; match === null && j < parameters.length; j++) {
      const value = parameters[j].value;
      if (regexp.test(value)) {
        match = new Match(regexp, value);
      }
    }
  }
  if (match) {
    console.warn(match);
  }
  return match;
};

export default function (): Assertion {
  return Assertion.assert(
    'secret-in-log',
    'Secret in log',
    'event',
    (e: Event) => {
      const matches: Match[] = Object.keys(REGEXES).reduce((memo, key) => {
        const match = findMatchingValue(REGEXES[key], e.parameters!);
        if (match) {
          memo.push(match);
        }
        return memo;
      }, [] as Match[]);
      if (matches.length > 0) {
        return matches.map((match) => ({
          level: 'error',
          message: `${match.value} contains secret ${match.regexp}`,
        }));
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => e.parameters !== null && e.codeObject.labels.has('log');
      assertion.description = `Log contains secret-like text`;
    }
  );
}
