import { SequenceDiagramOptions } from '@appland/sequence-diagram';
import { CompareFilter } from '../../lib/loadAppMapConfig';
import { ScanTask } from '../scan/ScanTask';
import { IndexTask } from '../index/IndexTask';

export type SequenceDiagramTask = {
  name: 'sequence-diagram';
  verbose: boolean;
  appmapFile: string;
  maxSize: number;
  compareFilter: CompareFilter;
  specOptions: SequenceDiagramOptions;
};

export function isSequenceDiagramTask(
  task: ScanTask | SequenceDiagramTask | IndexTask
): task is SequenceDiagramTask {
  return task.name === 'sequence-diagram';
}
