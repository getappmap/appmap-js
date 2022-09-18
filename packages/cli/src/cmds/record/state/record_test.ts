import areTestCommandsConfigured from '../test/areTestCommandsConfigured';
import { State } from '../types/state';
import testCommandsNeeded from './testCommandsNeeded';
import testCommandsAvailable from './testCommandsAvailable';
import RecordContext from '../recordContext';

// This is the initial state of test case recording. From here, the record command is
// configured by the user and executed.
export default async function test(recordContext: RecordContext): Promise<State> {
  if (await areTestCommandsConfigured(recordContext)) {
    recordContext.populateTestCommands();

    return testCommandsAvailable;
  } else {
    return testCommandsNeeded;
  }
}
