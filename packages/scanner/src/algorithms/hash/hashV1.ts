import { abstractSqlAstJSON, Event } from '@appland/models';
import sha256 from 'crypto-js/sha256';
import assert from 'assert';
import { createHash } from 'crypto';

// BEGIN COMMENT

// Moved here from packages/models, in order to retain backwards compatibility with Hash v1
// as the Event algoritms hash and identityHash are updated.

function qualifiedMethodId(event: Event): string {
  const { definedClass, isStatic, methodId } = event;
  assert(definedClass, 'Event.definedClass');
  return `${definedClass}${isStatic ? '.' : '#'}${methodId}`;
}

// Returns a string suitable for durable identification of a call event
// that's independent of parameters and return values.
// For SQL queries, it's a JSON of abstract query AST.
// For HTTP queries, it's the method plus normalized path info.
// For function calls it's the qualified function id.
// TODO: This can be removed/deprecated when the current hash algorithm is removed.
function callEventToString(event: Event): string {
  const { sqlQuery, route } = event;
  if (sqlQuery) return abstractSqlAstJSON(sqlQuery, event.sql!.database_type);
  if (route) return route;
  return qualifiedMethodId(event);
}

// Returns a short string (hash) suitable for durable identification
// of a call event that's independent of parameters and return values.
// For SQL queries, it considers the abstract query (ignoring differences in literal values).
// For HTTP queries, it considers the method plus normalized path info.
// For function calls it's the qualified function id.
// Non-call events will throw an error.
function hashEvent(event: Event): string {
  if ((event as any).event !== 'call') throw new Error('tried to hash a non-call event');
  return sha256(callEventToString(event)).toString();
}

// END COMMENT

export default class HashV1 {
  private hash;

  constructor(ruleId: string, findingEvent: Event, relatedEvents: Event[]) {
    this.hash = createHash('sha256');
    this.hash.update(hashEvent(findingEvent));
    this.hash.update(ruleId);

    // Admittedly odd, this implementation matches the original hash algorithm.
    const uniqueEvents = new Set<number>();
    const hashEvents: Event[] = [];
    relatedEvents.unshift(findingEvent);
    relatedEvents.forEach((event) => {
      if (uniqueEvents.has(event.id)) return;

      uniqueEvents.add(event.id);
      hashEvents.push(event);
    });

    // This part where the hashes go into a Set, and there is some kind of ordering as a side-
    // effect, is particularly weird.
    new Set(hashEvents.map((e) => hashEvent(e))).forEach((eventHash) => {
      this.hash.update(eventHash);
    });
  }

  digest(): string {
    return this.hash.digest('hex');
  }
}
