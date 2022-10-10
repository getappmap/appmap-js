import assert from 'assert';
import { AppMap, Event } from '@appland/models';

type EventFilter = (event: Event) => boolean;

export function selectEvents(
  appmap: AppMap,
  includedCodeObjectIds: Set<string>,
  requiredCodeObjectIds: Set<string>
): Event[] {
  const isIncludedCodeObject: EventFilter = (event: Event) =>
    includedCodeObjectIds.has(event.codeObject.fqid);

  const hasRequiredCodeObjectAncestor = (): EventFilter => {
    assert(requiredCodeObjectIds.size > 0, 'Expecting at least one required code object id');

    const stack: Event[] = [];
    let numberOfRequiredCodeObjectsInStack = 0;
    const includedStackEvents = new Set<Event>();
    appmap.events.forEach((event: Event) => {
      if (event.isCall()) {
        if (requiredCodeObjectIds.has(event.codeObject.fqid)) {
          if (numberOfRequiredCodeObjectsInStack === 0) {
            // Mark ancestors as included
            stack.forEach((event) => includedStackEvents.add(event));
          }
          numberOfRequiredCodeObjectsInStack += 1;
        }

        if (numberOfRequiredCodeObjectsInStack > 0) {
          includedStackEvents.add(event);
        }
        stack.push(event);
      } else {
        stack.pop();
        if (requiredCodeObjectIds.has(event.codeObject.fqid)) {
          numberOfRequiredCodeObjectsInStack -= 1;
        }
      }
    });

    return (event: Event): boolean => includedStackEvents.has(event.callEvent);
  };

  // Event code object id must be in the user-requested set.
  let includedEvents = appmap.events.filter(isIncludedCodeObject);

  // Event stack must include at least one required code object id, unless
  // none are required.
  if (requiredCodeObjectIds.size > 0) {
    includedEvents = includedEvents.filter(hasRequiredCodeObjectAncestor());
  }

  return includedEvents;
}
