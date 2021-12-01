import MatchPatternConfig from 'src/configuration/types/matchPatternConfig';
import { StringFilter } from '../../types';

function matchValueString(value: string, fn: (value: string) => boolean): boolean {
  if (!value) {
    return false;
  }
  if (typeof value !== 'string') {
    return false;
  }

  return fn(value);
}

export function buildFilter(pattern: MatchPatternConfig): StringFilter {
  if (pattern.equal) {
    return (value: string): boolean =>
      matchValueString(value, (value: string): boolean => value === pattern.equal!);
  } else if (pattern.include) {
    return (value: string): boolean =>
      matchValueString(value, (value: string): boolean => {
        return value.includes(pattern.include!);
      });
  } else {
    const regexp =
      pattern.match! instanceof RegExp
        ? pattern.match!
        : new RegExp(pattern.match! as unknown as string);
    return (value: string): boolean =>
      matchValueString(value, (value: string): boolean => {
        return regexp.test(value);
      });
  }
}

export function buildFilters(patterns: MatchPatternConfig[]): StringFilter[] {
  return patterns.map(buildFilter);
}
