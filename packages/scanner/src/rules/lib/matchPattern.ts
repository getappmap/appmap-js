import MatchPatternConfig from 'src/configuration/types/matchPatternConfig';
import { StringFilter } from '../../types';

export function buildFilter(pattern: MatchPatternConfig): StringFilter {
  function respectIgnoreCaseFlag(value: string): string {
    return pattern.ignoreCase ? value.toLocaleLowerCase() : value;
  }

  if (pattern.equal) {
    const testStr = respectIgnoreCaseFlag(pattern.equal!);
    return (value: string): boolean => respectIgnoreCaseFlag(value) === testStr;
  } else if (pattern.include) {
    const testStr = respectIgnoreCaseFlag(pattern.include!);
    return (value: string): boolean => respectIgnoreCaseFlag(value).includes(testStr);
  } else {
    const regexp =
      pattern.match instanceof RegExp
        ? pattern.match
        : new RegExp(pattern.match as unknown as string, pattern.ignoreCase ? 'i' : undefined);
    return (value: string): boolean => regexp.test(value);
  }
}

export function buildFilters(patterns: MatchPatternConfig[]): StringFilter[] {
  return patterns.map(buildFilter);
}
