import UI from '../userInteraction';
import ScanContext from '../scanContext';
import { State } from '../state';

export default async function initial(_context: ScanContext): Promise<State | undefined> {
  const choices: Record<string, string | null> = {
    'add breakpoint': 'addBreakpoint',
    'run scan': 'scan',
    quit: null,
  };

  const { action: actionName } = await UI.prompt({
    name: 'action',
    type: 'list',
    message: 'How would you like to proceed?:',
    choices: Object.keys(choices),
  });
  const action = choices[actionName];

  if (!action) return;

  return (await import(`./${action}`)).default;
}
