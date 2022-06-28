import { spawn } from 'child_process';
import UI from '../userInteraction';
import { abspath, openInBrowser, openInTool, openInVSCode } from './openers';

interface Opener {
  name: string;
  toolId?: string;
  fn: (appMapFile: string, toolId?: string) => Promise<void>;
}

const Openers: Opener[] = [
  { name: 'Browser tab', fn: openInBrowser },
  { name: 'VS Code', fn: openInVSCode },
  { name: 'IntelliJ', toolId: 'idea', fn: openInTool },
  { name: 'PyCharm', toolId: 'pycharm', fn: openInTool },
  { name: 'RubyMine', toolId: 'x-mine', fn: openInTool },
];

export default async function showAppMap(appMapFile: string) {
  const termProgram = process.env.TERM_PROGRAM;
  if (process.platform === 'darwin' && termProgram === 'vscode') {
    spawn('code', [abspath(appMapFile)]);
  }
  else {
    await openInBrowser(appMapFile);
  }

  const {action} = await UI.prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do next:',
    choices: [`Reopen ${appMapFile}`, 'Exit']
  });
  if (action.startsWith('Reopen')) {
    await showAppMap(appMapFile);
  }
}
