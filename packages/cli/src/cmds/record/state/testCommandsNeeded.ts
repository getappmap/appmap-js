import obtainTestCommands from '../prompt/obtainTestCommands';
import RecordContext from '../recordContext';
import { State } from '../types/state';
import testCommandsAvailable from './testCommandsAvailable';

export default async function testCommandsNeeded(recordContext: RecordContext): Promise<State> {
  await obtainTestCommands(recordContext);

  recordContext.populateTestCommands();

  return testCommandsAvailable;
}
