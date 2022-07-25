import { Event } from '@appland/models';
import { createHash } from 'crypto';
import { verbose } from '../../rules/lib/util';

function hashEvent(entries: string[], prefix: string, event: Event): void {
  Object.keys(event.stableProperties)
    .sort()
    .forEach((key) =>
      entries.push([[prefix, key].join('.'), event.stableProperties[key].toString()].join('='))
    );
}

/**
 * Builds a hash (digest) of a finding. The digest is constructed by first building a canonical
 * string of the finding, of the form:
 *
 * ```
 * [
 *   rule=<rule-id>
 *   commandEvent.<property1>=value1
 *   ...
 *   commandEvent.<propertyN>=valueN
 *   findingEvent.<property1>=value1
 *   ...
 *   findingEvent.<propertyN>=valueN
 *   participatingEvent.<eventName1>=value1
 *   ...
 *   participatingEvent.<eventName1>=valueN
 *   ...
 *   participatingEvent.<eventNameN>=value1
 *   ...
 *   participatingEvent.<eventNameN>=valueN
 * ]
 * ```
 *
 * Participating events are sorted by the event name. Properties of each event are sorted by
 * the property name. Event properties are provided by `Event#stableProperties`.
 *
 * If the finding event has no @command, @job, or http_server_request ancestor, then the
 * commandEvent is replaced by rootEvent: the root ancestor of the finding event.
 */
export default class HashV2 {
  private hashEntries: string[] = [];
  private hash;

  constructor(ruleId: string, findingEvent: Event, participatingEvents: Record<string, Event>) {
    this.hash = createHash('sha256');

    const hashEntries = [['rule', ruleId].join('=')];
    this.hashEntries = hashEntries;

    const commandEvent = (event: Event): { command?: Event; root?: Event } => {
      if (event.labels.has('command') || event.labels.has('job') || event.httpServerRequest)
        return { command: event };

      if (!event.parent) return { root: event };

      return commandEvent(event.parent);
    };

    const command = commandEvent(findingEvent);
    if (command.command) hashEvent(hashEntries, 'commandEvent', command.command);
    else if (command.root) hashEvent(hashEntries, 'rootEvent', command.root);
    hashEvent(hashEntries, 'findingEvent', findingEvent);
    Object.keys(participatingEvents)
      .sort()
      .forEach((key) => {
        const event = participatingEvents[key];
        hashEvent(hashEntries, `participatingEvent.${key}`, event);
      });

    if (verbose()) console.log(hashEntries);

    hashEntries.forEach((e) => this.hash.update(e));
  }

  get canonicalString(): string {
    return this.hashEntries.join('\n');
  }

  digest(): string {
    return this.hash.digest('hex');
  }
}
