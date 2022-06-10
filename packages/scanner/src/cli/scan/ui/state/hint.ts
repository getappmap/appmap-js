import ScanContext from '../scanContext';
import { State } from '../state';
import UI from '../userInteraction';
import hitBreakpoint from './hitBreakpoint';

export default async function hint(_context: ScanContext): Promise<State> {
  UI.progress([`Some suggested expressions:`, 'appMap', 'check', 'event', 'scope'].join('\n'));

  return hitBreakpoint;
}
