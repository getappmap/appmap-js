import observe from 'inquirer/lib/utils/events';
import { Diagram } from '../types';

export const extension = '.json';

function removeParent(key: string, value: any): any {
  if (key === 'parent') return undefined;

  return value;
}

export function format(diagram: Diagram): string {
  return JSON.stringify(diagram, removeParent, 2);
}
