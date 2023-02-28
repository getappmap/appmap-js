import { AppMap, Event } from '@appland/models';
import Specification from './specification';

type EventFilter = (event: Event) => boolean;

export function selectEvents(appmap: AppMap, specification: Specification): Event[] {
  const isIncludedCodeObject: EventFilter = (event: Event) =>
    !!specification.isIncludedCodeObject(event.codeObject);

  const hasRequiredCodeObjectAncestor = (): EventFilter => {
    if (!specification.hasRequiredCodeObjects)
      throw Error('Expecting at least one required code object id');

    const stack: Event[] = [];
    let numberOfRequiredCodeObjectsInStack = 0;
    const includedStackEvents = new Set<Event>();
    appmap.events.forEach((event: Event) => {
      if (event.isCall()) {
        if (specification.isRequiredCodeObject(event.codeObject)) {
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
        if (specification.isRequiredCodeObject(event.codeObject)) {
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
  if (specification.hasRequiredCodeObjects) {
    includedEvents = includedEvents.filter(hasRequiredCodeObjectAncestor());
  }

  return includedEvents;
}
