import * as fs from 'fs';
import { Event } from '@appland/models';
import JSONStream from 'JSONStream';

type EventInfo = {
  id: string;
  method_id: string;
  defined_class: string;
  count: number;
  size: number;
  path: string;
  lineno: string | undefined;
};

const KILOBYTE = 1000;
const MEGABYTE = KILOBYTE * 1000;
const GIGABYTE = MEGABYTE * 1000;

const eventName = (event: Event): string =>
  `${event.definedClass}${event.isStatic ? '.' : '#'}${event.methodId}`;

const sizeof = (obj: any): number => JSON.stringify(obj).length;

function displaySize(size: number): string {
  let divisor: number;
  let suffix: string;

  if (size > GIGABYTE) {
    divisor = GIGABYTE;
    suffix = 'GB';
  } else if (size > MEGABYTE) {
    divisor = MEGABYTE;
    suffix = 'MB';
  } else if (size > KILOBYTE) {
    divisor = KILOBYTE;
    suffix = 'KB';
  } else {
    divisor = 1;
    suffix = 'bytes';
  }

  return `${(size / divisor).toFixed(1)} ${suffix}`;
}

async function accumulateEvents(mapPath: string): Promise<Array<EventInfo>> {
  const events = {};

  return new Promise((resolve, reject) => {
    fs.createReadStream(mapPath).pipe(
      JSONStream.parse('events.*')
        .on('data', (obj: any) => {
          if (
            obj.event !== 'call' ||
            obj.sql_query ||
            obj.http_server_request ||
            obj.http_client_request
          ) {
            return;
          }

          const event = new Event(obj);
          const name = eventName(event);
          const size = sizeof(obj);
          const entry = events[name];

          if (entry) {
            entry.size += size;
            entry.count += 1;
          } else {
            events[name] = { ...event, size, count: 1 };
          }
        })
        .on('close', () => {
          resolve(
            Object.keys(events)
              .map((key) => {
                const { lineno, path, size, count, method_id, defined_class } = events[key];
                return { id: key, method_id, defined_class, count, size, path, lineno };
              })
              .sort((a, b) => b.count - a.count)
          );
        })
    );
  });
}

export async function statsForMap(argv: any) {
  const eventsStats = (await accumulateEvents(argv.map)).slice(0, argv.limit);

  if (argv.json) {
    console.log(JSON.stringify(eventsStats, null, 2));
    return;
  }

  eventsStats.forEach((callData, index) => {
    const { id, count, size } = callData;
    console.log(
      [`${index + 1}. ${id}`, `count: ${count}`, `estimated size: ${displaySize(size)}`, ''].join(
        '\n      '
      )
    );
  });
}
