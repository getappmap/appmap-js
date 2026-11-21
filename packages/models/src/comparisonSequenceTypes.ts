import type { ComparisonView } from './comparison';

export type ComparisonSequenceActor = { id: string; name: string; order: number };
type SequenceNode = {
  digest: string;
  subtreeDigest: string;
  children: ComparisonSequenceAction[];
  eventIds: number[];
  /** Unique only within this serialized base, head or diff diagram. */
  elementId?: string;
  diffMode?: 1 | 2 | 3 | 4;
  elapsed?: number;
  formerName?: string;
  formerResult?: string;
  movedFrom?: { name: string; actorId?: string };
  labels?: string[];
};
type SequenceMessage = SequenceNode & { caller?: string; callee: string };
export type ComparisonSequenceAction =
  | (SequenceNode & { nodeType: 1; count: number })
  | (SequenceMessage & {
      nodeType: 3;
      name: string;
      static?: boolean;
      stableProperties: Record<string, string | number | boolean | null>;
      returnValue?: {
        raisesException: boolean;
        returnValueType?: { name: string; properties?: string[] };
      };
    })
  | (SequenceMessage & { nodeType: 4 | 5; route: string; status?: number })
  | (SequenceMessage & { nodeType: 6; query: string });
export type ComparisonSequenceDiagram = {
  actors: ComparisonSequenceActor[];
  rootActions: ComparisonSequenceAction[];
};
export type ComparisonSequenceView = ComparisonView<
  ComparisonSequenceDiagram,
  { actorOrder: string[] }
> & { schemaVersion: 1 };
