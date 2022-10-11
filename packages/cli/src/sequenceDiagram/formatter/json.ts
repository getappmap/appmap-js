import { Diagram } from '../types';

export const extension = '.json';

export function format(diagram: Diagram): string {
  return JSON.stringify(diagram, null, 2);
}
