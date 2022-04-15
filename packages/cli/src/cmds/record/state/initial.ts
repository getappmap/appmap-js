import UI from '../../userInteraction';
import { State } from '../types/state';

export default async function initial(): Promise<State> {
  const choices = {
    'remote recording': 'remote',
    'test cases': 'test',
  };

  const { method: methodName } = await UI.prompt({
    name: 'method',
    type: 'list',
    message: 'Choose recording method:',
    choices: Object.keys(choices),
  });
  const method = choices[methodName];
  return (await import(`./record_${method}`)).default;
}
