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
  returnIndex?: number;

  constructor(
    public diagram: Diagram,
    public action: Action,
    public nodeType: 'call' | 'return' | 'loop',
    public index: number
  ) {
    this.children = [];
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

  get nodeResult(): string {
    return nodeResult(this.action);
  }

  get hasElapsed(): boolean {
    return this.action.elapsed !== undefined;
  }

  get elapsedTimeMs(): number {
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
