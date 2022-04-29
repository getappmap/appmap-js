import { Event } from '@appland/models';

export default function sanitizesData(event: Event, objectId: number, label: string): boolean {
  return (
    event.labels.has(label) &&
    !!event.returnValue &&
    !!event.returnValue.object_id &&
    event.returnValue.object_id === objectId
  );
}
