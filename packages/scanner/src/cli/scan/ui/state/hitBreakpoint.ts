import ScanContext from '../scanContext';
import { State } from '../state';
import UI from '../userInteraction';
import initial from './initial';

export default async function hitBreakpoint(context: ScanContext): Promise<State> {
  const choices: Record<string, string | null> = {
    'show hints': 'hint',
    'evaluate expression': 'eval',
    'add breakpoint': 'addBreakpoint',
    continue: 'scan',
    quit: null,
  };

  UI.progress(`In breakpoint: ${context.breakpoint}`);
  if (context.progress.appMapFileName) {
    const line = context.progress.appMapFileName;
    const eventId = context.progress.event?.id || context.progress.scope?.id;
    UI.progress([line, eventId].filter(Boolean).join(':'));
  }

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
