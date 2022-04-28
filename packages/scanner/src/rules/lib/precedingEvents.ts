import { Event, EventNavigator } from '@appland/models';

export default function* precedingEvents(
  rootEvent: Event,
  target: Event
): Generator<EventNavigator> {
  for (const event of new EventNavigator(rootEvent).descendants()) {
    if (event.event === target) {
      break;
    }
    yield event;
  }
}
