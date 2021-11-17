import type { Event } from '@appland/models';
import type { MatchResult } from '../types';

import Labels from '../wellKnownLabels';
import Assertion from '../assertion';
import { hasTransactionDetails } from '../scope/sqlTransactionScope';

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

  const result: MatchResult = {
    level: 'error',
    event: event,
    message: `${missing} jobs created but not cancelled in this rolled back transaction`,
    // if there's a mismatch and there are cancellations we can't tell
    // for sure which creations they match, so return everything
    relatedEvents: [...creationEvents, ...cancellationEvents],
  };

  return [result];
}

const assertion = Assertion.assert(
  'job-not-cancelled',
  'Job created in a rolled back transaction and not cancelled',
  matcher
);

export default {
  scope: 'transaction',
  scanner: () => assertion,
};
