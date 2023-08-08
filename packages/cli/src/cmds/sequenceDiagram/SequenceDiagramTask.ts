import { SequenceDiagramOptions } from '@appland/sequence-diagram';
import { CompareFilter } from '../../lib/loadAppMapConfig';

export type SequenceDiagramTask = {
  verbose: boolean;
  appmapFile: string;
  maxSize: number;
  compareFilter: CompareFilter;
  specOptions: SequenceDiagramOptions;
};
