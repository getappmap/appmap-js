import type RuleInstance from '../ruleInstance';
import parseRuleDescription from './lib/parseRuleDescription';

const id = 'unfulfilled-promise';
const RULE: RuleInstance = {
  id,
  title: 'Unfulfilled Promise',
  description: parseRuleDescription(id),
  enumerateScope: true,
  build: () => ({ matcher: (e) => e.returnValue?.value === 'Promise { <pending> }' }),
};

export default RULE;
