/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
import UI from '../userInteraction';
import ScanContext from '../scanContext';
import { State } from '../state';
import hitBreakpoint from './hitBreakpoint';
import { inspect } from 'util';

export default async function initial(context: ScanContext): Promise<State | undefined> {
  const { expression } = await UI.prompt({
    name: 'expression',
    type: 'input',
    message: 'Enter expression:',
  });

  let result;
  try {
    result = ((check, appMap, scope, event): any => {
      return eval(expression);
    })(
      context.progress.check,
      context.progress.appMap,
      context.progress.scope,
      context.progress.event
    );
  } catch (err) {
    console.log(err);
  }

  if (result) console.log(inspect(result));

  return hitBreakpoint;
}
