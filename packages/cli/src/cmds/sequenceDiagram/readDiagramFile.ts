import { readFile } from 'fs/promises';
import { Actor, Diagram, setParent } from '@appland/sequence-diagram';
import { buildSequenceDiagramFromAppMapFile } from './buildSequenceDiagramFromAppMap';

export type SerializedAction = {
  caller?: string | Actor;
  callee?: string | Actor;
  children?: SerializedAction[];
};

export async function readDiagramFile(fileName: string): Promise<Diagram> {
  const jsonData = JSON.parse(await readFile(fileName, 'utf-8')) as any;

  let diagram: Diagram;
  if (jsonData.actors && jsonData.rootActions) {
    diagram = jsonData as Diagram;
  } else if (jsonData.classMap && jsonData.events && jsonData.metadata) {
    diagram = buildSequenceDiagramFromAppMapFile(fileName, jsonData);
  } else {
    throw new Error(`File '${fileName}' must be AppMap or sequence diagram JSON`);
  }

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
