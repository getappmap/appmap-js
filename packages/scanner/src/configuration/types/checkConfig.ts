import MatchEventConfig from './matchEventConfig';

interface MatchConfig {
  scope?: MatchEventConfig;
  event?: MatchEventConfig;
}

/**
 * CheckConfig represents the user's configuration of an Check, which is an
 * instantiation of a Rule. Each CheckConfing is read from the scanners configuration file.
 */
export default interface CheckConfig {
  // rule is expected to match the file name of the rule in src/rules.
  rule: string;
  // default: id
  id?: string;
  scope?: string;
  include?: MatchConfig[];
  exclude?: MatchConfig[];
  // Properties are mapped to rule Options.
  properties?: Record<string, any>;
}
