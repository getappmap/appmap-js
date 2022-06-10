import { BreakOnCounter, BreakOnEvent, Breakpoint } from '../../breakpoint';
import ScanContext from '../scanContext';
import { State } from '../state';
import UI from '../userInteraction';
import scan from './scan';

export default async function addBreakpoint(context: ScanContext): Promise<State> {
  const onCounter = async (): Promise<Breakpoint | undefined> => {
    const { sequenceNumber } = await UI.prompt({
      name: 'sequenceNumber',
      type: 'number',
      message: 'Sequence number:',
    });

    return new BreakOnCounter(Number(sequenceNumber));
  };

  const onEventName = async (): Promise<Breakpoint | undefined> => {
    const { eventName } = await UI.prompt({
      name: 'eventName',
      type: 'input',
      message: 'Event name:',
    });

    return new BreakOnEvent(eventName);
  };

  const choices: Record<string, (() => Promise<Breakpoint | undefined>) | null> = {
    'break at sequence number': onCounter,
    'break on event name': onEventName,
    quit: null,
  };

  const { action: actionName } = await UI.prompt({
    name: 'action',
    type: 'list',
    message: 'How would you like to proceed?:',
    choices: Object.keys(choices),
  });
  const action = choices[actionName];

  if (!action) return scan;

  const breakpoint = await action();
  if (breakpoint) context.progress.addBreakpoint(breakpoint);

  return scan;
}
