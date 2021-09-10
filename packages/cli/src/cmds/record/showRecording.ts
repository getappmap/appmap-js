import { RequestOptions } from 'http';
import UI from '../userInteraction';
import { openInBrowser, openInJetBrains, openInVSCode } from './openers';

const Openers = {
  'Browser tab': openInBrowser,
  'VS Code': openInVSCode,
  JetBrains: openInJetBrains,
};

export default async function showRecording(requestOptions: RequestOptions) {
  UI.progress(
    `Now that you've created the AppMap, I'm sure you'd like to take a look at it!`
  );
  UI.progress(
    `There are three options for viewing the AppMap. Please choose one (you can do this as many times as you'd like).`
  );
  const { outputTool } = await UI.prompt({
    type: 'list',
    name: 'outputTool',
    message: 'How would you like to view your AppMap:',
    choices: Object.keys(Openers).concat(['Exit']),
  });

  const opener = Openers[outputTool];
  if (opener) {
    await opener();
    await showRecording(requestOptions);
  }
}
