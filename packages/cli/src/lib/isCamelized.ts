import { splitCamelized } from './splitCamelized';

export function isCamelized(str: string): boolean {
  if (str.length < 3) return false;

  return splitCamelized(str) !== str;
}
