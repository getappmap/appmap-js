import { Event } from '@appland/models';
import MatchEventConfig from '../../configuration/types/matchEventConfig';
import { AppMapIndex, EventFilter } from '../../types';
import { buildFilter as buildMatchPattern } from './matchPattern';

export function buildFilter(pattern: MatchEventConfig): EventFilter {
  const testFn = buildMatchPattern(pattern.test);

  const propertyFn = {
    id: (e: Event) => e.codeObject.id,
    type: (e: Event) => e.codeObject.type,
    fqid: (e: Event) => e.codeObject.fqid,
    query: (e: Event, appMapIndex: AppMapIndex) => (e.sql ? appMapIndex.sqlNormalized(e) : null),
    route: (e: Event) => e.route,
  };

  return (event: Event, appMapIndex: AppMapIndex): boolean => {
    const fn = propertyFn[pattern.property];
    if (!fn) {
      throw new Error(`Unrecognized Event filter property: ${pattern.property}`);
    }
    const value = fn(event, appMapIndex);
    if (!value) {
      return false;
    }

    return testFn(value);
  };
}

export function buildFilters(patterns: MatchEventConfig[]): EventFilter[] {
  return patterns.map(buildFilter);
}
