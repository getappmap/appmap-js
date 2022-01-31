import { AppMap, Event } from '@appland/models';
import { EventType } from './types';

function isDescendantOf(event: Event, rootEvent: Event): boolean {
  return !!event.ancestors().find((ancestor) => ancestor === rootEvent);
}

function filterEvents(events: Event[], rootEvent: Event | undefined): Event[] {
  if (rootEvent) {
    return events.filter((event) => isDescendantOf(event, rootEvent));
  }

  return events;
}

const SpecializedTypes = ['sql_query', 'http_client_request', 'http_server_request'];

export default class AppMapIndex {
  eventsByLabel: Record<string, Event[]> = {};
  eventsByType: Record<string, Event[]> = {};

  constructor(public appMap: AppMap) {
    const events = appMap.events;
    for (let index = 0; index < events.length; index++) {
      const event = events[index];
      if (!event.isCall()) continue;

      {
        const type = SpecializedTypes.find((type) => (event as any)[type]) || 'function';
        let events = this.eventsByType[type];
        if (!events) {
          events = [];
          this.eventsByType[type] = events;
        }
        events.push(event);
      }

      {
        event.labels.forEach((label) => {
          let events = this.eventsByLabel[label];
          if (!events) {
            events = [];
            this.eventsByLabel[label] = events;
          }
          events.push(event);
        });
      }
    }
  }

  forType(type: EventType, rootEvent?: Event): Event[] {
    return filterEvents(this.eventsByType[type] || [], rootEvent);
  }

  forLabel(label: string, rootEvent?: Event): Event[] {
    return filterEvents(this.eventsByLabel[label] || [], rootEvent);
  }
}
