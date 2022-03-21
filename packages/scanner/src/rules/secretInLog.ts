import { Event, ParameterObject } from '@appland/models';
import { MatchResult, Rule, RuleLogic } from 'src/types';
import SecretsRegexes, { looksSecret } from '../analyzer/secretsRegexes';
import { emptyValue } from './lib/util';
import recordSecrets from '../analyzer/recordSecrets';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';

class Match {
  constructor(public regexp: RegExp | string, public value: string) {}
}

const secrets: Set<string> = new Set();

const findInLog = (event: Event): MatchResult[] | undefined => {
  if (!event.parameters) return;

  const matches: Match[] = [];

  for (const { value } of event.parameters) {
    if (emptyValue(value)) continue;

    const patterns: (RegExp | string)[] = [];

    if (looksSecret(value)) {
      // Only look for the exact matching regexes if it matches the catchall regex
      patterns.push(
        ...Object.values(SecretsRegexes)
          .flat()
          .filter((re) => re.test(value))
      );
    }

    for (const secret of secrets) {
      if (value.includes(secret)) patterns.push(secret);
    }

    matches.push(...patterns.map((pattern) => new Match(pattern, value)));
  }

  if (matches.length > 0) {
    return matches.map((match) => ({
      event,
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
      if (e.codeObject.labels.has(Log)) {
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
  impactDomain: 'Security',
  enumerateScope: true,
  references: {
    'CWE-532': new URL('https://cwe.mitre.org/data/definitions/532.html'),
  },
  description: parseRuleDescription('secretInLog'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#secret-in-log',
  build,
} as Rule;
