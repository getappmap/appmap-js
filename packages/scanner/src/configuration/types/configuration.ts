import AssertionConfig from './assertionConfig';

/**
 * Configuration is the code representation of the scanner configuration file.
 */
export default interface Configuration {
  scanners: AssertionConfig[];
}
