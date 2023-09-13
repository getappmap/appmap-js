const REPLACEMENTS = {
  '\n': '\\n',
  '\0': '\\0',
  '"': '\\"',
  '\\': '\\\\',
};

export default function quotePath(path: string, force = false): string {
  if (!(force || path.match(/[\n\0"]/))) return path;

  const quoted = path.replaceAll(/[\n\0\\"]/g, (ch) => REPLACEMENTS[ch]);
  return `"${quoted}"`;
}
