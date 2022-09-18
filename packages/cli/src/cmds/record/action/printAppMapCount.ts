import chalk from 'chalk';
import UI from '../../userInteraction';
import countAppMaps from './countAppMaps';

export default async function printAppMapCount(appMapDir: string) {
  const appMapCount = await countAppMaps(appMapDir);

  const successMessage = [
    chalk.green(`Success! There are now ${appMapCount} AppMap files in directory '${appMapDir}'.`),
    '',
    chalk.blue('NEXT STEP: Open AppMaps'),
    '',
    'Return to the AppMap extension in your code editor to open and view your AppMaps.',
  ];

  UI.success(successMessage.join('\n'));
}
