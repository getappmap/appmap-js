import { Event } from '@appland/models';

// Builds a function that returns true if the provided event argument has the specified
// objectId as the receiver or as a parameter value.
export default (objectId: number) => {
  return (event: Event): boolean =>
    (!!event.receiver && event.receiver!.object_id === objectId) ||
    (!!event.parameters && event.parameters!.some((param) => param.object_id === objectId));
};
