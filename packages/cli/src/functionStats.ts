import { analyzeSQL, normalizeSQL } from '@appland/models';
import { EventMatch, Trigram } from './search/types';
import { formatValue, formatHttpServerRequest, formatHttpClientRequest } from './utils';

function reduceTrigrams(trigrams: Trigram[]): Trigram[] {
  const uniqueIds = new Set(trigrams.map((t) => t.id));
  const sortOrder = [...uniqueIds].sort().reduce((memo, id, index) => {
    memo[id] = index;
    return memo;
  }, {});

  return trigrams
    .filter((t) => {
      const newTrigram = uniqueIds.has(t.id);
      if (newTrigram) {
        uniqueIds.delete(t.id);
        return true;
      }
      return false;
    })
    .sort((a, b) => sortOrder[a.id] - sortOrder[b.id]);
}

export default class FunctionStats {
  constructor(public eventMatches: EventMatch[]) {
    this.eventMatches = eventMatches;
  }

  toJSON() {
    const trigram = (trigram: Trigram) => [
      trigram.callerId,
      trigram.codeObjectId,
      trigram.calleeId,
    ];

    return {
      eventMatches: this.eventMatches,
      returnValues: this.returnValues,
      httpServerRequests: this.httpServerRequests,
      sqlQueries: this.sqlQueries,
      sqlTables: this.sqlTables,
      callers: this.callers,
      ancestors: this.ancestors,
      packageTrigrams: this.packageTrigrams.map(trigram),
      classTrigrams: this.classTrigrams.map(trigram),
      functionTrigrams: this.functionTrigrams.map(trigram),
    };
  }

  get appMapNames(): string[] {
    return [...new Set(this.eventMatches.map((e) => e.appmap))].sort();
  }

  get returnValues(): string[] {
    return [...new Set(this.eventMatches.map((e) => e.event.returnValue).map(formatValue))].sort();
  }

  get httpServerRequests(): string[] {
    return [
      ...new Set(
        this.eventMatches
          .map((e) => [e.event].concat(e.ancestors).filter((a) => a.httpServerRequest))
          .flat()
          .filter(Boolean)
          .map((e) => formatHttpServerRequest(e))
      ),
    ].sort();
  }

  get sqlQueries(): string[] {
    return [
      ...new Set(
        this.eventMatches
          .map((e) => [e.event].concat(e.sqlQueries).filter((d) => d.sql))
          .flat()
          .map((e) => normalizeSQL(e.sql.sql, e.sql.database_type))
      ),
    ].sort();
  }

  get sqlTables(): string[] {
    return [
      ...new Set(
        this.eventMatches
          .map((e) => [e.event].concat(e.sqlQueries).filter((d) => d.sql))
          .flat()
          .map((e) => analyzeSQL(e.sql.sql, (_err) => {}))
          .filter(Boolean)
          .filter((e) => typeof e === 'object')
          .map((sql) => sql.tables)
          .flat()
      ),
    ].sort();
  }

  get httpClientRequests(): string[] {
    return [
      ...new Set(
        this.eventMatches
          .map((e) => [e.event].concat(e.httpClientRequests).filter((d) => d.httpClientRequest))
          .flat()
          .filter(Boolean)
          .map((e) => formatHttpClientRequest(e))
      ),
    ].sort();
  }

  get callers(): string[] {
    return [
      ...new Set(
        this.eventMatches
          .map((e) => e.caller)
          .filter(Boolean)
          .map((e) => e.fqid.toString())
      ),
    ];
  }

  get ancestors(): string[] {
    return [
      ...new Set(
        this.eventMatches
          .map((e) => e.ancestors)
          .filter((list) => list.length > 0)
          .map((list) =>
            list.map((e) => (e.isFunction ? e.codeObjectIds[0]?.toString() : undefined))
          )
          .flat()
          .filter(Boolean) as string[]
      ),
    ];
  }

  get packageTrigrams() {
    return reduceTrigrams(this.eventMatches.map((e) => e.packageTrigrams).flat());
  }

  get classTrigrams() {
    return reduceTrigrams(this.eventMatches.map((e) => e.classTrigrams).flat());
  }

  get functionTrigrams() {
    return reduceTrigrams(this.eventMatches.map((e) => e.functionTrigrams).flat());
  }
}
