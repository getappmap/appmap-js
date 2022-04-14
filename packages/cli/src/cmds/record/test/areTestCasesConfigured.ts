import { readConfig, readConfigOption, readSetting } from '../configuration';
import inferTestCommands from '../state/inferTestCommands';

export default async function areTestCasesConfigured(): Promise<boolean> {
  let testCommands: string[] | undefined = (await readConfigOption(
    'test_recording.test_commands',
    []
  )) as string[];

  testCommands ||= await inferTestCommands();

  return true;
}
