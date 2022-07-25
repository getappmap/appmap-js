import { Event } from '@appland/models';
import { createHash } from 'crypto';

export default class HashV1 {
  private hash;

  constructor(ruleId: string, findingEvent: Event, relatedEvents: Event[]) {
    this.hash = createHash('sha256');
    this.hash.update(findingEvent.hash);
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
    new Set(hashEvents.map((e) => e.hash)).forEach((eventHash) => {
      this.hash.update(eventHash);
    });
  }

  digest(): string {
    return this.hash.digest('hex');
  }
}
