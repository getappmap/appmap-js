import { serveAndOpenAppMap } from '../../lib/serveAndOpen';
import { join, resolve } from 'path';

export function abspath(file: string) {
  return resolve(process.cwd(), file);
}

export async function openInBrowser(appMapFile: string, verifyInSubdir: boolean) {
  await serveAndOpenAppMap(appMapFile, verifyInSubdir);
}

export function vscodeURL(appMapFile: string) {
  return join('vscode://file/', abspath(appMapFile));
}
