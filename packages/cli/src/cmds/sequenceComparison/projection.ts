import type { ComparisonReference } from '@appland/models';
import type { Action, Diagram } from '@appland/sequence-diagram';
import { flatten, TargetAction } from './actions';

// One index per recording side. Numeric event IDs may overlap across sides.
// A grouped action can own many events; an event must have exactly one owner.
export class DisplayProjection {
  private readonly elements = new Map<string, TargetAction>();
  private readonly events = new Map<number, TargetAction>();

  constructor(display: Diagram) {
    for (const action of flatten(display)) {
      if (!action.elementId || this.elements.has(action.elementId))
        throw new Error('Invalid comparison projection target');
      this.elements.set(action.elementId, action);
      for (const id of action.eventIds) {
        if (this.events.has(id)) throw new Error('Ambiguous comparison event membership');
        this.events.set(id, action);
      }
    }
  }

  // This is deliberately stronger than the generic v1 model contract, whose
  // event IDs are contextual and whose structural targets may be eventless.
  verify(ref: ComparisonReference): void {
    const target = ref.elementIds?.length === 1 ? this.elements.get(ref.elementIds[0]) : undefined;
    if (
      !target ||
      !ref.eventIds?.length ||
      new Set(ref.eventIds).size !== ref.eventIds.length ||
      ref.eventIds.some((id) => this.events.get(id) !== target)
    )
      throw new Error('Invalid comparison reference event membership');
  }

  project(action: Action | undefined): ComparisonReference | undefined {
    if (!action) return undefined;
    const target = this.events.get(action.eventIds[0]);
    if (!target?.elementId) throw new Error('Missing comparison projection event membership');
    const ref = { elementIds: [target.elementId], eventIds: [...action.eventIds] };
    this.verify(ref); // Also refuses a semantic action split across display targets.
    return ref;
  }

  parentElementId(action: Action): string | null {
    return action.parent ? this.project(action.parent)!.elementIds![0] : null;
  }
}
