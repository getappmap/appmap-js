import { Event } from '@appland/models';

export default function isCommand(event: Event): string | undefined {
  let label: string | undefined;

  if (event.labels.has('command')) label = 'command';
  else if (event.labels.has('job')) label = 'job';
  else if (event.httpServerRequest) label = 'request';

  return label;
}
