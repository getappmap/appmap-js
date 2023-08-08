import { SequenceDiagramTask } from '../sequenceDiagram/SequenceDiagramTask';

export type ScanTask = {
  name: 'scan';
  verbose: boolean;
  appmapFile: string;
  maxSize: number;
};

export function isScanTask(task: ScanTask | SequenceDiagramTask): task is ScanTask {
  return task.name === 'scan';
}
