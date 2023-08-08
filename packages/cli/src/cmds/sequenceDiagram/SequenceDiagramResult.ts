import { Diagram } from '@appland/sequence-diagram';

export type SequenceDiagramResult = {
  oversized?: boolean;
  error?: Error;
  diagram?: Diagram;
};
