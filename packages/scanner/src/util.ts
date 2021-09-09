export function ideLink(filePath: string, ide: string): string {
  const OSC = '\u001B]';
  const BEL = '\u0007';
  const SEP = ';';

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const supportsHyperlinks = require('supports-hyperlinks');

  if (!supportsHyperlinks.stdout) {
    return filePath;
  }

  return [
    OSC,
    '8',
    SEP,
    SEP,
    `${ide}://open?url=file://${filePath}`,
    BEL,
    filePath,
    OSC,
    '8',
    SEP,
    SEP,
    BEL,
  ].join('');
}
