import ConfigurationProvider from './configurationProvider';
import ConfigurationProviderYaml from './configurationProviderYaml';
import ConfigurationProviderJs from './configurationProviderJs';
import Assertion from '../assertion';

interface ConfigurationProviderFactory {
  readonly provider: new (...args: any[]) => ConfigurationProvider;
  readonly filePattern: RegExp;
}

const PROVIDER_FACTORIES: readonly ConfigurationProviderFactory[] = [
  { provider: ConfigurationProviderYaml, filePattern: /\.ya?ml$/ },
  { provider: ConfigurationProviderJs, filePattern: /\.[jt]s$/ },
];

export default async function loadConfiguration(
  path: string
): Promise<readonly Assertion[] | undefined> {
  const factory = PROVIDER_FACTORIES.find(({ filePattern }) => filePattern.test(path));
  if (!factory) {
    return undefined;
  }

  const provider = new factory.provider(path);
  return await provider.getConfig();
}
