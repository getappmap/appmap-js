import Assertion from '../assertion';

export default interface ConfigurationProvider {
  getConfig(): Promise<readonly Assertion[]> | readonly Assertion[];
}
