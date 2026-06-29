import type { Breakpoint } from '../../breakpoint';
import type ScanContext from '../scanContext';
import type { State } from '../state';
import hitBreakpoint from './hitBreakpoint';
import initial from './initial';

export default async function scan(context: ScanContext): Promise<State> {
  return new Promise<State>((resolve) => {
    context.on('breakpoint', (breakpoint: Breakpoint) => {
      context.removeAllListeners();
      context.breakpoint = breakpoint;
      resolve(hitBreakpoint);
    });
    context.on('complete', () => {
      context.removeAllListeners();
      resolve(initial);
    });

    context.scan();
  });
}
