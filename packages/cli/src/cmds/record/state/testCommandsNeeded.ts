import obtainTestCommands from '../prompt/obtainTestCommands';
import { State } from '../types/state';
import testCommandsAvailable from './testCommandsAvailable';

export default async function testCommandsNeeded(): Promise<State> {
  await obtainTestCommands();

  return testCommandsAvailable;
}
