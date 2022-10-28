const DisplayNames: Record<string, string> = {
  'http:HTTP server requests': 'Web server',
};

export function displayName(fqid: string): string {
  if (DisplayNames[fqid]) return DisplayNames[fqid];

  let tokens = fqid.split(':');
  tokens.shift();
  let name = tokens.join(':');
  if (name.includes('/')) name = name.split('/').pop()!;

  return name;
}
