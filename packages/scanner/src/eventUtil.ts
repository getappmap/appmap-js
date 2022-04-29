import { CodeObject, Event } from '@appland/models';

// TODO: These interfaces can be removed once @appland/models is up to date.
interface EventConstructor {
  new (data: unknown): Event;
}

interface CodeObjectConstructor {
  new (data: unknown, parent?: CodeObject): CodeObject;
}

export function cloneCodeObject(sourceObject: CodeObject): CodeObject | undefined {
  const codeObjects = [
    sourceObject,
    ...(sourceObject.ancestors as unknown as () => CodeObject[])(),
  ];
  let currentSourceObject = codeObjects.pop();
  let lastClonedObject;

  while (currentSourceObject) {
    lastClonedObject = new (CodeObject as CodeObjectConstructor)(
      (currentSourceObject as unknown as { data: unknown }).data,
      lastClonedObject
    );
    currentSourceObject = codeObjects.pop();
  }

  return lastClonedObject;
}

// FIXME: These methods should live in @appland/models. Perhaps via Event#clone.

export function cloneEvent(sourceEvent: Event): Event {
  // We need to clone both the sourceEvent and the 'linkedEvent'. The linkedEvent will be a return
  // if `sourceEvent` is a call and vice versa. Some accessors on the Event will use the linkedEvent
  // as a convienence, so we may run into errors if we don't restore this relationship. For example,
  // accessing `elapsedTime` on a call event will retrieve the value from the associated return
  // event.
  const linkedEvent = new (Event as EventConstructor)(sourceEvent.linkedEvent);
  const event = new (Event as EventConstructor)(sourceEvent);
  event.linkedEvent = linkedEvent;

  // The codeObject is used as well so it'll need a clone.
  const codeObject = cloneCodeObject(sourceEvent.codeObject);
  if (codeObject) {
    event.codeObject = codeObject;
  }

  return event;
}
