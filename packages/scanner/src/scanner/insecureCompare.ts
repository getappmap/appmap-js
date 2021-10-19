import { Event } from '@appland/models';
import recordSecrets from '../analyzer/recordSecrets';
import SecretsRegexes from '../analyzer/secretsRegexes';
import Assertion from '../assertion';

const BCRYPT_REGEXP = /^[$]2[abxy]?[$](?:0[4-9]|[12][0-9]|3[01])[$][./0-9a-zA-Z]{53}$/;

const secrets: Set<string> = new Set();

function stringEquals(e: Event): string | boolean | import('../types').MatchResult[] | undefined {
  if (!e.parameters || !e.receiver || e.parameters!.length !== 1) {
    return;
  }

  const args = [e.receiver!.value, e.parameters![0].value];

  function isBcrypt(str: string): boolean {
    return BCRYPT_REGEXP.test(str);
  }

  function isSecret(str: string): boolean {
    if (secrets.has(str)) {
      return true;
    }
    return !!Object.keys(SecretsRegexes).find(
      (key): boolean => !!SecretsRegexes[key].find((re: RegExp): boolean => re.test(str))
    );
  }

  // BCrypted strings are safe to compare using equals()
  if (args.every(isBcrypt)) {
    return;
  }
  if (!args.every(isSecret)) {
    return;
  }

  return true;
}

const scanner = function (): Assertion {
  return Assertion.assert(
    'insecure-compare',
    'Insecure comparison of secrets',
    (e: Event) => {
      if (e.codeObject.labels.has('secret')) {
        recordSecrets(secrets, e);
      }
      if (e.parameters && e.codeObject.labels.has('string.equals')) {
        return stringEquals(e);
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        e.isFunction &&
        (e.codeObject.labels.has('string.equals') || e.codeObject.labels.has('secret'));
      assertion.description = `Insecure comparison of secrets`;
    }
  );
};

export default { scanner };
