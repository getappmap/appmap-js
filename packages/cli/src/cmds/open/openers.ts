import serveAndOpenAppMap from './serveAndOpenAppMap';
import supportsHyperlinks from 'supports-hyperlinks';

// See also: https://github.com/applandinc/scanner/pull/9/files#diff-3294a832ea2276e554177e0b3007cc2d401c082912c7fbde49fa09141bf1aed1R1
function hyperlink(filePath: string, link: string): string {
  const OSC = '\u001B]';
  const BEL = '\u0007';
  const SEP = ';';

  if (!supportsHyperlinks.stdout) {
    return filePath;
  }

  return [
    OSC,
    '8',
    SEP,
    SEP,
    link,
    BEL,
    filePath,
    OSC,
    '8',
    SEP,
    SEP,
    BEL,
  ].join('');
}

export async function openInBrowser(appMapFile: string) {
  await serveAndOpenAppMap(appMapFile);
}

export async function openInVSCode(appMapFile: string) {
  const link = 'vscode://file/' + appMapFile;
  console.log(hyperlink(appMapFile, link));
}

export async function openInTool(appMapFile: string, toolId?: string) {
  const link = `${toolId}://open?file=${appMapFile}`;
  console.log(hyperlink(appMapFile, link));
}
