import ScanContext from '../scanContext';
import { State } from '../state';
import UI from '../userInteraction';
import initial from './initial';

export default async function hitBreakpoint(context: ScanContext): Promise<State> {
  const choices: Record<string, string | null> = {
    'show hints': 'hint',
    'evaluate expression': 'eval',
    continue: 'scan',
    quit: null,
  };

  UI.progress(`In breakpoint: ${context.breakpoint}`);

  const { action: actionName } = await UI.prompt({
    name: 'action',
    type: 'list',
    message: 'Choose action:',
    choices: Object.keys(choices),
  });

  const action = choices[actionName];

  if (!action) return initial;

  return (await import(`./${action}`)).default;
}
