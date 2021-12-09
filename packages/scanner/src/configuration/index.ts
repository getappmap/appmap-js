import ConfigurationProvider from './configurationProvider';
import Check from 'src/check';

export async function loadConfiguration(path: string): Promise<Check[]> {
  const provider = new ConfigurationProvider(path);
  return await provider.getConfig();
}
