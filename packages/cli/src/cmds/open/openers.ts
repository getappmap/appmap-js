import serveAndOpenAppMap from './serveAndOpenAppMap';
import supportsHyperlinks from 'supports-hyperlinks';
import { join, resolve } from 'path';

// See also: https://github.com/applandinc/scanner/pull/9/files#diff-3294a832ea2276e554177e0b3007cc2d401c082912c7fbde49fa09141bf1aed1R1
function hyperlink(filePath: string, link: string): string {
  const OSC = '\u001B]';
  const BEL = '\u0007';
  const SEP = ';';

  if (!supportsHyperlinks.stdout) {
    return filePath;
  }

  return [OSC, '8', SEP, SEP, link, BEL, filePath, OSC, '8', SEP, SEP, BEL].join('');
}

export function abspath(file: string) {
  return resolve(process.cwd(), file);
}

export async function openInBrowser(appMapFile: string) {
  await serveAndOpenAppMap(appMapFile);
}

export function vscodeURL(appMapFile: string) {
  return join('vscode://file/', abspath(appMapFile));
}

export async function openInVSCode(appMapFile: string) {
  console.log(hyperlink(appMapFile, vscodeURL(appMapFile)));
}

export async function openInTool(appMapFile: string, toolId?: string) {
  const link = `${toolId}://open?file=${abspath(appMapFile)}`;
  console.log(hyperlink(appMapFile, link));
}
