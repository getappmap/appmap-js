import { ScanTask } from '../scan/ScanTask';
import { SequenceDiagramTask } from '../sequenceDiagram/SequenceDiagramTask';

export type IndexTask = {
  name: 'index';
  verbose: boolean;
  appmapFile: string;
  maxSize: number;
};

export function isIndexTask(task: ScanTask | SequenceDiagramTask | IndexTask): task is IndexTask {
  return task.name === 'index';
}
