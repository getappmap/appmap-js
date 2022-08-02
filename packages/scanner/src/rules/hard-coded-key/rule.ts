import { Event } from '@appland/models';
import { AppMapIndex, MatcherResult, RuleLogic } from '../../types';

function matcher(event: Event, appMapIndex: AppMapIndex): MatcherResult {
  if (!event.receiver) return;

  const receiverObjectId = event.receiver.object_id;
  const setKey = appMapIndex.appMap.events.find(
    (evt) =>
      evt.isCall() &&
      evt.receiver?.object_id === receiverObjectId &&
      evt.labels.has('crypto.set_key')
  );
  if (!setKey) return;

  const keyObject = setKey.parameters![0];
  if (!keyObject) return;

  const keyObjectId = keyObject.object_id;
  const obtainKey = appMapIndex.appMap.events.find(
    (evt) =>
      evt.isReturn() &&
      evt !== setKey.returnEvent &&
      !evt.codeObject.labels.has('string.unpack') &&
      evt.returnValue?.object_id === keyObjectId
  );
  if (!obtainKey) {
    return [
      {
        level: 'warning',
        event,
        message: `Cryptographic key is not obtained from a function, and may be hard-coded`,
        participatingEvents: { 'crypto.set_key': setKey },
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
