import process from 'node:process';
import { spawn } from 'child_process';
import UI from '../userInteraction';
import { abspath, openInBrowser } from './openers';

export default async function showAppMap(appMapFile: string) {
  function open() {
    if (process.platform === 'darwin' && process.env.TERM_PROGRAM === 'vscode')
      try {
        spawn('code', [abspath(appMapFile)]);
        return;
      } catch {} // fallthrough
    return openInBrowser(appMapFile, false);
  }

  await open();

  const { action } = await UI.prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do next:',
    choices: [`Reopen ${appMapFile}`, 'Exit'],
  });
  if (action.startsWith('Reopen')) {
    await showAppMap(appMapFile);
  }
}
