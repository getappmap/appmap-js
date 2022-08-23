import { Event, ValueBase } from '@appland/models';

function matches(template: ValueBase, value: ValueBase): boolean {
  if (template.object_id && template.object_id === value.object_id) return true;
  if (template.value && template.value === value.value) return true;
  return false;
}

/**
 * Value tracked with data flow analysis, along with the information about
 * its originating event and a list of any other such values that might have
 * been used in its generation.
 */
export type TrackedValue = {
  value: ValueBase;
  origin: Event;
  parents: ReadonlyArray<TrackedValue>;
};

class Matcher {
  constructor(root: Event, data: ReadonlyArray<ValueBase>) {
    for (const value of data) this.add(value, root, []);
  }

  add(value: ValueBase, origin: Event, parents: ReadonlyArray<TrackedValue>): void {
    if (isPrimitive(value)) return;
    this.tracked.set(value, { value, origin, parents });
  }

  match(value: ValueBase): TrackedValue | null {
    if (isPrimitive(value)) return null;
    for (const [probe, history] of this.tracked) {
      if (matches(probe, value)) return history;
    }
    return null;
  }

  matches(values: ReadonlyArray<ValueBase>): TrackedValue[] {
    return compact(values.map(this.match.bind(this)));
  }

  private tracked = new Map<ValueBase, TrackedValue>();
}

function isPrimitive(value: ValueBase) {
  // we don't want to record any nulls,
  // booleans or small strings and numbers
  return !value.value || value.value.length < 6;
}

function isNotNullOrUndefined<T>(x: T): x is Exclude<T, undefined | null> {
  return x !== undefined && x !== null;
}

function compact<T>(x: ReadonlyArray<T>): Exclude<T, undefined | null>[] {
  return x.filter(isNotNullOrUndefined);
}

/**
 * Tracks flow of data across the execution trace, identifying all function
 * calls which have a tracked object as its receiver or one of the parameters.
 * Any value such a function returns will also then become tracked.
 * The origin chain of all values is recorded, so full provenience up to
 * the starting set can be reconstructed.
 * @param trackedData Initial data to track.
 * @param startEvent The root event of the analysis.
 * @returns Events which have a tracked piece of data as an input, each
 * associated with the list of such inputs.
 */
export default function analyzeDataFlow(
  trackedData: ReadonlyArray<ValueBase>,
  startEvent: Event
): Map<Event, ReadonlyArray<TrackedValue>> {
  const matcher = new Matcher(startEvent, trackedData);
  const events = new Map<Event, ReadonlyArray<TrackedValue>>([
    [startEvent, matcher.matches(trackedData)],
  ]);

  startEvent.traverse({
    onEnter(event) {
      const inputs = compact([...(event.parameters || []), event.receiver]);
      const matches = matcher.matches(inputs);
      if (matches.length === 0) return;
      events.set(event, matches);
    },
    onExit({ callEvent, returnValue }) {
      if (!returnValue) return;
      const parents = events.get(callEvent);
      if (!parents) return;
      matcher.add(returnValue, callEvent, parents);
    },
  });

  return events;
}
