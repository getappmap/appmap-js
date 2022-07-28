import { Event } from '@appland/models';
import { createHash } from 'crypto';
import isCommand from '../../rules/lib/isCommand';
import { verbose } from '../../rules/lib/util';

function hashEvent(entries: string[], prefix: string, event: Event): void {
  Object.keys(event.stableProperties)
    .sort()
    .forEach((key) =>
      entries.push([[prefix, key].join('.'), event.stableProperties[key].toString()].join('='))
    );
}

const STACK_DEPTH = 3;

/**
 * Captures stack entries from distinct packages. Ancestors of the event are traversed up to the
 * command or root. Then, starting from the command or root, subsequent events which come from the
 * same package as their preceding event are removed. Then the last N entries remaining in the
 * stack are collected.
 *
 * @param event leaf event
 * @param participatingEvents output collector
 * @param depth number of events to include in the output
 */
export function captureStack(event: Event, depth = STACK_DEPTH): Event[] {
  let ancestor = event.parent;
  const stack: Event[] = [];
  while (ancestor) {
    stack.push(ancestor);
    ancestor = isCommand(ancestor) ? undefined : ancestor.parent;
  }

  const packageOf = (event?: Event): string | undefined => {
    if (!event) return;

    if (event.codeObject.type !== 'function') return;

    return event.codeObject.packageOf;
  };

  return stack
    .filter(
      (item, index) =>
        item.codeObject.type !== 'function' || packageOf(stack[index + 1]) !== packageOf(item)
    )
    .slice(0, depth);
}

/**
 * Builds a hash (digest) of a finding. The digest is constructed by first building a canonical
 * string of the finding, of the form:
 *
 * ```
 * [
 *   algorithmVersion=2
 *   rule=<rule-id>
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
 *   stack[1]=value1
 *   ...
 *   stack[1]=valueN
 *   ...
 *   stack[3]=value1
 *   ...
 *   stack[3]=valueN
 * ]
 * ```
 *
 * Participating events are sorted by the event name. Properties of each event are sorted by
 * the property name. Event properties are provided by `Event#stableProperties`.
 *
 * The partial stack included in the finding hash removes subsequent function calls from the
 * same package.
 */
export default class HashV2 {
  private hashEntries: string[] = [];
  private hash;

  constructor(ruleId: string, findingEvent: Event, participatingEvents: Record<string, Event>) {
    this.hash = createHash('sha256');

    const hashEntries = [
      ['algorithmVersion', '2'],
      ['rule', ruleId],
    ].map((e) => e.join('='));
    this.hashEntries = hashEntries;

    hashEvent(hashEntries, 'findingEvent', findingEvent);
    Object.keys(participatingEvents)
      .sort()
      .forEach((key) => {
        const event = participatingEvents[key];
        hashEvent(hashEntries, `participatingEvent.${key}`, event);
      });

    captureStack(findingEvent).forEach((event, index) =>
      hashEvent(hashEntries, `stack[${index + 1}]`, event)
    );

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
