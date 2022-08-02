import { Event } from '@appland/models';
import { MatcherResult, RuleLogic } from '../../types';
import { labels } from './metadata';

export const deprecatedAlgorithms = [
  /\bcbc\b/i,
  /\becb\b/i,
  /\b3?des\b/i,
  /\brc\d\b/i,
  /\bmd\d\b/i,
  /\bsha-?1\b/i,
];

// Also:
// https://securitymusings.com/article/1587/algorithm-and-key-length-deprecation
// http://www.daemonology.net/blog/2009-06-11-cryptographic-right-answers.html
// Password handling: As soon as you receive a password, hash it using scrypt or PBKDF2 and erase the plaintext password from memory.
// 1024-bit RSA or DSA
// 160-bit ECDSA (elliptic curves)
// 80/112-bit 2TDEA (two key triple DES)
// PKCS #1 v1.5

function matcher(event: Event): MatcherResult {
  if (!event.receiver) return;

  const receiverLabels: string[] = (event.receiver as any).labels || [];
  const deprecatedAlgorithm = receiverLabels
    .filter((label) => label.startsWith('crypto.algorithm.'))
    .map((label) => label.split('.').slice(2).join('.'))
    .find((label) => deprecatedAlgorithms.find((alg) => alg.test(label)));

  if (deprecatedAlgorithm) {
    return [
      {
        event,
        message: `Deprecated crypto algorithm: ${deprecatedAlgorithm}`,
      },
    ];
  }
}

export default function rule(): RuleLogic {
  return {
    matcher,
    where: (e: Event) => !!labels.find((label) => e.labels.has(label)),
  };
}
