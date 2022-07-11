import type { Event } from '@appland/models';
import type { MatchResult, Rule, RuleLogic } from '../types';
import Labels from '../wellKnownLabels';
import { hasTransactionDetails } from '../scope/sqlTransactionScope';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';

function build(): RuleLogic {
  function matcher(event: Event): MatchResult[] | undefined {
    if (!hasTransactionDetails(event))
      throw new Error(`expected event ${event.id} to be a transaction`);
    if (event.transaction.status === 'commit') return;

    const creationEvents = event.transaction.events.filter(({ labels }) =>
      labels.has(Labels.JobCreate)
    );
    const cancellationEvents = event.transaction.events.filter(({ labels }) =>
      labels.has(Labels.JobCancel)
    );
    const missing = creationEvents.length - cancellationEvents.length;
    if (missing === 0) return;

    return creationEvents.map((jobCreationEvent) => ({
      event: jobCreationEvent,
      message: `Job created by ${jobCreationEvent.codeObject.prettyName} was not cancelled when the enclosing transaction rolled back`,
      participatingEvents: { beginTransaction: event },
    }));
  }

  return {
    matcher,
  };
}

export default {
  id: 'job-not-cancelled',
  title: 'Job created in a rolled back transaction and not cancelled',
  scope: 'transaction',
  enumerateScope: false,
  labels: [Labels.JobCreate, Labels.JobCancel],
  impactDomain: 'Stability',
  references: {
    'CWE-672': new URL('https://cwe.mitre.org/data/definitions/672.html'),
  },
  description: parseRuleDescription('jobNotCancelled'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#job-not-cancelled',
  build,
} as Rule;
