import {
  actionActors,
  nodeName,
  nodeResult,
  Action,
  Actor,
  Diagram,
} from '@appland/sequence-diagram';
import assert from 'assert';

export enum CallDirection {
  Self = 'self',
  Right = 'right',
  Left = 'left',
}

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
    public diagram: Diagram,
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
}
