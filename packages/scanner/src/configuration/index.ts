import ConfigurationProvider from './configurationProvider';
import { AssertionPrototype } from 'src/types';

export async function loadConfiguration(path: string): Promise<AssertionPrototype[]> {
  const provider = new ConfigurationProvider(path);
  return await provider.getConfig();
}
