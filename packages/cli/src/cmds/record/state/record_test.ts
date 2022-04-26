import areTestCommandsConfigured from '../test/areTestCommandsConfigured';
import { State } from '../types/state';
import testCommandsNeeded from './testCommandsNeeded';
import testCommandsAvailable from './testCommandsAvailable';

// This is the initial state of test case recording. From here, the record command is
// configured by the user and executed.
export default async function test(): Promise<State> {
  if (await areTestCommandsConfigured()) {
    return testCommandsAvailable;
  } else {
    return testCommandsNeeded;
  }
}
