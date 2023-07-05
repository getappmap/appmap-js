import { spawn } from 'child_process';
import UI from '../userInteraction';
import { abspath, openInBrowser } from './openers';

export default async function showAppMap(appMapFile: string) {
  const termProgram = process.env.TERM_PROGRAM;
  if (process.platform === 'darwin' && termProgram === 'vscode') {
    spawn('code', [abspath(appMapFile)]);
  } else {
    await openInBrowser(appMapFile, false);
  }

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
