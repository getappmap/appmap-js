import { Rule } from './index';
import { RuleLogic } from './types';

export default interface RuleInstance extends Rule {
  // User-defined options for the rule.
  Options?: any; // FIXME

  // Function to instantiate the rule logic from configured options.
  build: (options: this['Options']) => RuleLogic;
}
