import { Event, EventNavigator } from '@appland/models';
import { URL } from 'url';
import { RuleLogic } from '../types';
import parseRuleDescription from './lib/parseRuleDescription';
import RuleInstance from '../ruleInstance';

const validatedBy = (iterator: Iterator<EventNavigator>): boolean => {
  let i: IteratorResult<EventNavigator> = iterator.next();
  while (!i.done) {
    if (
      i.value.event.methodId !== undefined &&
      ['valid?', 'validate'].includes(i.value.event.methodId!) // TODO: change this to use labels
    ) {
      return true;
    }
    i = iterator.next();
  }

  return false;
};

function build(): RuleLogic {
  return {
    matcher: (event: Event) => !validatedBy(new EventNavigator(event).descendants()),
    where: (e: Event) => e.isFunction && ['save', 'save!'].includes(e.methodId!),
  };
}

const RULE: RuleInstance = {
  id: 'save-without-validation',
  title: 'Save without validation',
  enumerateScope: true,
  impactDomain: 'Stability',
  references: {
    'CWE-20': new URL('https://cwe.mitre.org/data/definitions/20.html'),
  },
  description: parseRuleDescription('saveWithoutValidation'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#save-without-validation',
  build,
};
export default RULE;
