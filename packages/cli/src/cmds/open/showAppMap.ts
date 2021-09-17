import UI from '../userInteraction';
import { openInBrowser, openInTool, openInVSCode } from './openers';

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
  UI.progress(
    `There are three options for viewing the AppMap. Please choose one (you can do this as many times as you'd like).`
  );
  const { outputTool } = await UI.prompt({
    type: 'list',
    name: 'outputTool',
    message: 'How would you like to view your AppMap:',
    choices: Openers.map((o) => o.name).concat(['Exit']),
  });

  const opener = Openers.find((o) => o.name === outputTool);
  if (opener) {
    await opener.fn(appMapFile, opener.toolId);
    await showAppMap(appMapFile);
  }
}
