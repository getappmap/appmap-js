import { SequenceDiagramOptions } from '@appland/sequence-diagram';
import { CompareFilter } from '../../lib/loadAppMapConfig';
import { ScanTask } from '../scan/ScanTask';

export type SequenceDiagramTask = {
  name: 'sequence-diagram';
  verbose: boolean;
  appmapFile: string;
  maxSize: number;
  compareFilter: CompareFilter;
  specOptions: SequenceDiagramOptions;
};

export function isSequenceDiagramTask(
  task: ScanTask | SequenceDiagramTask
): task is SequenceDiagramTask {
  return task.name === 'sequence-diagram';
}
