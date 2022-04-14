import { readConfig } from '../configuration';
import inferTestCommands from '../state/inferTestCommands';

export default async function areTestCasesConfigured(): Promise<boolean> {
  const config = await readConfig();
  if (!config) return false;

  const language = config.language;
  if (!language) return false;

  const testCommands = config.testCommands || (await inferTestCommands(config));
  if (!testCommands) return false;

  return true;
}
