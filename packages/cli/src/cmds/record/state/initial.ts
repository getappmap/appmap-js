import UI from '../../userInteraction';
import RecordContext from '../recordContext';
import { State } from '../types/state';

export async function createState(method: string): Promise<State> {
  return (await import(`./record_${method}`)).default;
}

export default async function initial(
  recordContext: RecordContext
): Promise<State> {
  const choices = {
    'test cases': 'test',
    'remote recording': 'remote',
  };

  const { method: methodName } = await UI.prompt({
    name: 'method',
    type: 'list',
    message: 'Choose recording method:',
    choices: Object.keys(choices),
  });
  const method = choices[methodName];

  recordContext.recordMethod = method;
  return createState.bind(null, method);
}
