import { Event } from '@appland/models';
import { AppMapIndex, MatcherResult, RuleLogic } from '../../types';

function matcher(event: Event, appMapIndex: AppMapIndex): MatcherResult {
  if (!event.receiver) return;

  const objectId = event.receiver.object_id;
  const precedingEvents = appMapIndex.appMap.events.filter(
    (evt) => evt.receiver?.object_id === objectId && evt.id < event.id
  );
  if (!precedingEvents.find((evt) => evt.labels.has('crypto.set_auth_data'))) {
    return [
      {
        event,
        message: 'Encryption is not authenticated',
      },
    ];
  }
}

export default function rule(): RuleLogic {
  return {
    matcher,
    where: (e: Event) => e.labels.has('crypto.encrypt'),
  };
}
