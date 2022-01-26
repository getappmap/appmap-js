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
  if (process.platform === 'darwin') {
    if (termProgram === 'vscode') {
      spawn('code', [abspath(appMapFile)]);
      return;
    }
  }

  UI.progress(
    `There are multiple options for viewing the AppMap. Please choose one (you can do this as many times as you'd like).`
  );
  const { outputTool } = await UI.prompt({
    type: 'list',
    name: 'outputTool',
    message: 'How would you like to view your AppMap:',
    choices: Openers.map((o) => o.name).concat(['Exit']),
  });

  const opener = Openers.find((o) => o.name === outputTool);
  if (opener) {
    console.log();
    console.log(`Click this link to open the AppMap in ${outputTool}:`);
    console.log();
    await opener.fn(appMapFile, opener.toolId);
    console.log();
    await showAppMap(appMapFile);
  }
}
