import {
  actionActors,
  nodeName,
  nodeResult,
  Action,
  Actor,
  Diagram,
  DiffMode,
} from '@appland/sequence-diagram';
import assert from 'assert';
import DiagramSpec from './DiagramSpec';

export enum CallDirection {
  Self = 'self',
  Right = 'right',
  Left = 'left',
}

type ActorId = string;

export class ActionSpec {
  children?: ActionSpec[];
  callIndex?: number;
  returnIndex?: number;
  // Indicates whether this action is the the first, or last, action in a group. In these cases,
  // the action rendering will leave extra space for the group enclosure box.
  public openGroup?: boolean;
  // See above.
  public closeGroup?: boolean;

  constructor(
    public diagramSpec: DiagramSpec,
    public action: Action,
    public nodeType: 'call' | 'return' | 'loop',
    // Index of this action in the array of all ActionSpecs in the diagram. Because the diagram
    // is rendered as a single grid, the index is the row index, and is not reset to zero
    // for child actions.
    public index: number,
    // Number of open transactions on the caller actor. This factor affects the length of the
    // action line and placement of the arrow.
    public callerLifecycleDepth?: number,
    // Number of open transactions on the callee actor. Effect is analogous to callerLifecycleDepth,
    // but used for the return arrow to the callee.
    public calleeLifecycleDepth?: number
  ) {
    this.children = [];
  }

  get id(): string {
    const [caller, callee] = actionActors(this.action);
    return [caller, this.action.nodeType, this.action.subtreeDigest, callee]
      .filter(Boolean)
      .join(':');
  }

  get diagram(): Diagram {
    return this.diagramSpec.diagram;
  }

  get ancestorIndexes() {
    const result: number[] = [];
    let parent = this.diagramSpec.parentOf(this);
    while (parent) {
      result.push(parent.index);
      parent = this.diagramSpec.parentOf(parent);
    }
    return result;
  }

  get gridRows(): string {
    return [this.index + 2, this.index + 2].join(' / ');
  }

  get maxGridColumn(): number {
    return this.diagram.actors.length + 1;
  }

  get diffClasses(): string[] {
    const result: string[] = [];
    if (this.action.diffMode) {
      result.push('diff');
    }
    if (this.action.diffMode === DiffMode.Insert) {
      result.push('diff-insert');
    } else if (this.action.diffMode === DiffMode.Delete) {
      result.push('diff-delete');
    } else if (this.action.diffMode === DiffMode.Change) {
      result.push('diff-change');
    }
    return result;
  }

  get groupMemberAttributes(): Record<string, string | number> {
    return {
      '--open-group-count': this.openGroup ? 1 : 0,
      '--close-group-count': this.closeGroup ? 1 : 0,
    };
  }

  get lifecycleAttributes(): Record<string, string | number> {
    return {
      '--caller-lifecycle-depth': this.callerLifecycleDepth || 0,
      '--callee-lifecycle-depth': this.calleeLifecycleDepth || 0,
    };
  }

  get callArrowDirection(): CallDirection {
    const direction = this.calleeActionIndex - this.callerActionIndex;
    if (direction > 0) return CallDirection.Right;
    else if (direction < 0) return CallDirection.Left;
    return CallDirection.Self;
  }

  get nodeName(): string {
    return nodeName(this.action);
  }

  get nodeResult(): string | undefined {
    return nodeResult(this.action);
  }

  get hasElapsed(): boolean {
    return this.action.elapsed !== undefined;
  }

  get elapsedTimeMs(): number | undefined {
    if (this.action.elapsed === undefined) return;

    return +(this.action.elapsed * 1000).toPrecision(3);
  }

  // Gets the minimum and maximum action index that are spanned by any descendant.
  get descendantsActorIndexSpan(): [number, number] {
    let actorIds: Set<ActorId> = new Set();

    const collectActors = (action: Action): void => {
      actionActors(action)
        .filter(Boolean)
        .forEach((actor) => actorIds.add(actor!.id));
      action.children.forEach((child) => collectActors(child));
    };
    this.action.children.forEach((child) => collectActors(child));
    const indexes = [...actorIds]
      .map((actorId) => this.diagram.actors.findIndex((a) => a.id === actorId))
      .filter((id) => id >= 0)
      .sort();

    return [indexes[0], indexes[indexes.length - 1]];
  }

  // Gets the display column index of the caller. Column 1 is used for the "world" -
  // e.g. the user or client. So the diagram actors start with index 2.
  get callerActionIndex(): number {
    const actors = actionActors(this.action);
    if (!actors[0]) return 1;

    const actorIndex = this.diagram.actors.findIndex((actor: Actor) => actors[0]!.id === actor.id);
    assert(actorIndex !== -1);
    return actorIndex + 2;
  }

  // Gets the display column index of the callee.
  // TODO: For outbound RPC, is the callee column greater than the last actor?
  get calleeActionIndex(): number {
    const actors = actionActors(this.action);
    if (!actors[1]) return 1;

    const actorIndex = this.diagram.actors.findIndex((actor: Actor) => actors[1]!.id === actor.id);
    assert(actorIndex !== -1);
    return actorIndex + 2;
  }

  get hasResult(): boolean {
    return nodeResult(this.action as Action) !== undefined;
  }

  isCollapsed(collapsedActionState: boolean[]): boolean {
    return (
      this.ancestorIndexes.find((ancestorIndex) => collapsedActionState[ancestorIndex]) !==
      undefined
    );
  }
}
