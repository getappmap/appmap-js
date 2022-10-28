import { Diagram } from '../types';

export const extension = '.json';

function filterFields(key: string, value: any): any {
  if (key === 'parent') return;
  if (value === undefined) return;

  if (['caller', 'callee'].includes(key)) return value.id;

  return value;
}

export function format(diagram: Diagram): string {
  return JSON.stringify(diagram, filterFields, 2);
}
