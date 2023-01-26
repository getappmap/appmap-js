import { Actor, Diagram, setParent } from './types';

export type SerializedAction = {
  caller?: string | Actor;
  callee?: string | Actor;
  children?: SerializedAction[];
};

export default function unparseDiagram(diagramData: Diagram): Diagram {
  const diagram = diagramData;
  const actors = new Map<string, Actor>();
  diagram.actors.forEach((actor) => actors.set(actor.id, actor));

  const resolveActors = (action: SerializedAction): void => {
    if (action.caller) action.caller = actors.get(action.caller as string);
    if (action.callee) action.callee = actors.get(action.callee as string);
    if (action.children) action.children.forEach((child) => resolveActors(child));
  };

  diagram.rootActions.forEach((action) => setParent(action));
  diagram.rootActions.forEach((action) => resolveActors(action as SerializedAction));

  return diagram;
}
