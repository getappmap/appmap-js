import uncamelize from 'uncamelize';

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

const sanitizeKeyword = (keyword: string) =>
  keyword
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, ' ')
    .split(' ');

export default function queryKeywords(keywords: string[]): string[] {
  return keywords
    .map((keyword) => keyword.split(/[\s/\-_[\]:\$]+/g))
    .flat()
    .map((keyword) => uncamelize(keyword, ' ').split(/[\s]+/g))
    .flat()
    .map((keyword) => sanitizeKeyword(keyword))
    .flat()
    .map((str) => str.trim())
    .filter(Boolean)
    .filter((str) => str.length >= 3)
    .filter((str) => !STOP_WORDS.has(str));
}
