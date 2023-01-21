import path from 'path';

export default function isAncestorPath(ancestor: string, descendant: string): boolean {
  const relative = path.relative(ancestor, descendant);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}
