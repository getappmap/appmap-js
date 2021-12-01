import MatchEventConfig from './matchEventConfig';

interface MatchConfig {
  scope?: MatchEventConfig;
  event?: MatchEventConfig;
}

/**
 * AssertionConfig represents the user's configuration of an Assertion, as read from the
 * configuration file.
 */
export default interface AssertionConfig {
  // id is expected to match the file name of the scanner in src/scanner.
  id: string;
  include?: MatchConfig[];
  exclude?: MatchConfig[];
  description?: string;
  // Properties are mapped to Assertion Options.
  properties?: Record<string, any>;
}
