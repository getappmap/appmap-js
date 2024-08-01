import { splitCamelized } from '../splitCamelized';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'he',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'that',
  'the',
  'to',
  'was',
  'were',
  'will',
  'with',
  'without',
]);

const sanitizeKeyword = (keyword: string): string[] =>
  keyword.replace(/[^\p{L}\p{N}]/gu, ' ').split(' ');

export default function queryKeywords(words: undefined | string | string[]): string[] {
  return (Array.isArray(words) ? words : [words])
    .map((word) => sanitizeKeyword(word || ''))
    .flat()
    .filter(Boolean)
    .map((word) => splitCamelized(word).split(/[\s_]+/g))
    .flat()
    .map((str) => str.trim())
    .filter(Boolean)
    .filter((str) => str.length >= 2)
    .filter((str) => !STOP_WORDS.has(str));
}
