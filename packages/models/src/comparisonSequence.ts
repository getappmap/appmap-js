// Serialized sequence v1, not the in-memory graph (caller/callee are actor IDs).
type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);
const eventIds = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((id) => Number.isSafeInteger(id) && id > 0);
const sides = ['base', 'head', 'diff'] as const;
const MAX_DEPTH = 256;
const MAX_ACTIONS = 100000;

function check(valid: boolean, path: string, expectation: string, errors: string[]): void {
  if (!valid) errors.push(`${path} must ${expectation}`);
}
function fields(value: RecordValue, names: string[], path: string, errors: string[]): void {
  names.forEach((name) =>
    check(text(value[name]), `${path}.${name}`, 'be a non-empty string', errors)
  );
}
function optional(
  value: RecordValue,
  name: string,
  valid: (v: unknown) => boolean,
  path: string,
  errors: string[]
): void {
  if (value[name] !== undefined)
    check(valid(value[name]), `${path}.${name}`, 'have the supported sequence shape', errors);
}

function validateReturnValue(value: unknown, path: string, errors: string[]): void {
  if (!record(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  check(
    typeof value.raisesException === 'boolean',
    `${path}.raisesException`,
    'be boolean',
    errors
  );
  if (value.returnValueType !== undefined) {
    if (!record(value.returnValueType)) errors.push(`${path}.returnValueType must be an object`);
    else {
      fields(value.returnValueType, ['name'], `${path}.returnValueType`, errors);
      optional(value.returnValueType, 'properties', strings, `${path}.returnValueType`, errors);
    }
  }
}

function validateDiagram(value: unknown, path: string, errors: string[]): void {
  if (!record(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  const actors = new Set<string>();
  if (!Array.isArray(value.actors)) errors.push(`${path}.actors must be an array`);
  else
    value.actors.forEach((actor, index) => {
      const at = `${path}.actors[${index}]`;
      if (!record(actor)) {
        errors.push(`${at} must be an actor object`);
        return;
      }
      fields(actor, ['id', 'name'], at, errors);
      check(finite(actor.order), `${at}.order`, 'be finite', errors);
      if (text(actor.id)) {
        check(!actors.has(actor.id), `${at}.id`, 'be unique within the diagram', errors);
        actors.add(actor.id);
      }
    });
  const elements = new Set<string>();
  const ancestors = new Set<object>();
  let count = 0;
  function visit(action: unknown, at: string, depth: number): void {
    if (++count > MAX_ACTIONS) return;
    if (!record(action)) {
      errors.push(`${at} must be an action object`);
      return;
    }
    if (ancestors.has(action)) {
      errors.push(`${at} contains a cycle`);
      return;
    }
    if (depth > MAX_DEPTH) {
      errors.push(`${at} exceeds sequence depth limit`);
      return;
    }
    ancestors.add(action);
    fields(action, ['digest', 'subtreeDigest'], at, errors);
    check(eventIds(action.eventIds), `${at}.eventIds`, 'contain positive safe integers', errors);
    optional(action, 'elementId', text, at, errors);
    if (text(action.elementId)) {
      check(
        !elements.has(action.elementId),
        `${at}.elementId`,
        'be unique within the diagram',
        errors
      );
      elements.add(action.elementId);
    }
    optional(action, 'elapsed', finite, at, errors);
    optional(action, 'labels', strings, at, errors);
    optional(action, 'formerName', (v) => typeof v === 'string', at, errors);
    optional(action, 'formerResult', (v) => typeof v === 'string', at, errors);
    optional(
      action,
      'diffMode',
      (v) => typeof v === 'number' && [1, 2, 3, 4].includes(v),
      at,
      errors
    );
    if (action.movedFrom !== undefined) {
      if (!record(action.movedFrom)) errors.push(`${at}.movedFrom must be a node identity`);
      else {
        fields(action.movedFrom, ['name'], `${at}.movedFrom`, errors);
        optional(action.movedFrom, 'actorId', text, `${at}.movedFrom`, errors);
      }
    }
    check(
      typeof action.nodeType === 'number' && [1, 3, 4, 5, 6].includes(action.nodeType),
      `${at}.nodeType`,
      'be a supported action type (1, 3, 4, 5, 6)',
      errors
    );
    // Known properties keep their schema-defined shapes on every action type.
    // Node type controls which fields are required, not which supplied fields are checked.
    for (const name of ['caller', 'callee', 'name', 'route', 'query'])
      optional(action, name, text, at, errors);
    optional(action, 'count', (v) => Number.isSafeInteger(v) && Number(v) >= 1, at, errors);
    optional(action, 'static', (v) => typeof v === 'boolean', at, errors);
    optional(action, 'status', finite, at, errors);
    optional(
      action,
      'stableProperties',
      (v) =>
        record(v) &&
        Object.values(v).every(
          (property) =>
            property === null ||
            typeof property === 'string' ||
            typeof property === 'boolean' ||
            finite(property)
        ),
      at,
      errors
    );
    if (action.returnValue !== undefined)
      validateReturnValue(action.returnValue, `${at}.returnValue`, errors);
    for (const role of ['caller', 'callee']) {
      if (text(action[role]))
        check(
          actors.has(action[role] as string),
          `${at}.${role}`,
          'identify a declared actor',
          errors
        );
    }
    if (action.nodeType === 1)
      check(action.count !== undefined, `${at}.count`, 'be supplied for a loop', errors);
    else if (action.nodeType === 3) {
      fields(action, ['callee', 'name'], at, errors);
      check(
        action.stableProperties !== undefined,
        `${at}.stableProperties`,
        'be supplied for a function',
        errors
      );
    } else if (action.nodeType === 4 || action.nodeType === 5)
      fields(action, ['callee', 'route'], at, errors);
    else if (action.nodeType === 6) fields(action, ['callee', 'query'], at, errors);
    if (!Array.isArray(action.children)) errors.push(`${at}.children must be an array`);
    else
      for (let i = 0; i < action.children.length && count <= MAX_ACTIONS; i++)
        visit(action.children[i], `${at}.children[${i}]`, depth + 1);
    ancestors.delete(action);
  }
  if (!Array.isArray(value.rootActions)) errors.push(`${path}.rootActions must be an array`);
  else
    for (let i = 0; i < value.rootActions.length && count <= MAX_ACTIONS; i++)
      visit(value.rootActions[i], `${path}.rootActions[${i}]`, 0);
  if (count > MAX_ACTIONS) errors.push(`${path} exceeds sequence action node limit`);
}

export function validateSequenceView(value: RecordValue, path: string, errors: string[]): void {
  if (value.schemaVersion !== 1) errors.push(`${path}.schemaVersion must be supported version 1`);
  sides.forEach((side) => validateDiagram(value[side], `${path}.${side}`, errors));
  if (record(value.alignment)) {
    const order = value.alignment.actorOrder;
    check(
      strings(order) && new Set(order).size === order.length,
      `${path}.alignment.actorOrder`,
      'contain unique actor IDs',
      errors
    );
  }
}

type Index = { elements: Map<string, number>; events: Map<number, number> };
function indexDiagram(diagram: unknown): Index {
  const index: Index = { elements: new Map(), events: new Map() };
  if (!record(diagram) || !Array.isArray(diagram.rootActions)) return index;
  const queue: unknown[] = [...(diagram.rootActions as unknown[])];
  const seen = new Set<object>();
  for (let i = 0; i < queue.length && i < MAX_ACTIONS; i++) {
    const action = queue[i];
    if (!record(action) || seen.has(action)) continue;
    seen.add(action);
    if (text(action.elementId))
      index.elements.set(action.elementId, (index.elements.get(action.elementId) ?? 0) + 1);
    if (eventIds(action.eventIds))
      for (const id of new Set(action.eventIds))
        index.events.set(id, (index.events.get(id) ?? 0) + 1);
    if (Array.isArray(action.children)) {
      const remaining = MAX_ACTIONS - queue.length;
      for (let j = 0; j < action.children.length && j < remaining; j++)
        queue.push(action.children[j]);
    }
  }
  return index;
}

/** Element IDs are diagram-local. Event-only references must not imply a unique
 * target when several actions carry the same recording event ID. */
export function validateSequenceReferences(bundle: RecordValue, errors: string[]): void {
  if (!record(bundle.views) || !record(bundle.views.sequence) || !Array.isArray(bundle.changes))
    return;
  const sequence = bundle.views.sequence;
  const indexes = {
    base: indexDiagram(sequence.base),
    head: indexDiagram(sequence.head),
    diff: indexDiagram(sequence.diff),
  };
  function reference(value: unknown, side: (typeof sides)[number], path: string): void {
    if (!record(value)) return;
    if (strings(value.elementIds))
      value.elementIds.forEach((id, i) => {
        if (indexes[side].elements.get(id) !== 1)
          errors.push(
            `${path}.elementIds[${i}] must resolve to exactly one sequence ${side} action`
          );
      });
    // With element IDs the target namespace is explicit; authentic event IDs may overlap.
    if (value.elementIds === undefined && eventIds(value.eventIds))
      value.eventIds.forEach((id, i) => {
        if (indexes[side].events.get(id) !== 1)
          errors.push(`${path}.eventIds[${i}] must resolve uniquely or supply elementIds`);
      });
  }
  bundle.changes.forEach((change, i) => {
    if (!record(change)) return;
    const path = `$.changes[${i}]`;
    if (!record(change.views) || !record(change.views.sequence)) return;
    for (const side of sides)
      reference(change.views.sequence[side], side, `${path}.views.sequence.${side}`);
    reference(change.base, 'base', `${path}.base`);
    reference(change.head, 'head', `${path}.head`);
  });
}
