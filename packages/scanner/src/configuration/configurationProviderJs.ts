import ConfigurationProvider from './configurationProvider';
import Assertion from '../assertion';

export default class ConfigurationProviderJs implements ConfigurationProvider {
  constructor(private readonly path: string) {}

  async getConfig(): Promise<readonly Assertion[]> {
    const { path } = this;
    return (await import(path)).default;
  }
}
