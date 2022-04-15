import { readConfigOption, TestCommand } from '../configuration';
import inferTestCommands from '../state/inferTestCommands';

export default async function areTestCasesConfigured(): Promise<boolean> {
  let testCommands: TestCommand[] | undefined = (await readConfigOption(
    'test_recording.test_commands',
    []
  )) as TestCommand[];

  if (!testCommands || testCommands.length === 0) await inferTestCommands();

  return true;
}
