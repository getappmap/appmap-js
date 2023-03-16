import * as fs from 'fs';
import { ClassMap, Event } from '@appland/models';
import JSONStream from 'JSONStream';

export type EventInfo = {
  fqid: string;
  count: number;
  size: number;
  location: string;
};

const KILOBYTE = 1000;
const MEGABYTE = KILOBYTE * 1000;
const GIGABYTE = MEGABYTE * 1000;

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

async function parseClassMap(mapPath: string): Promise<ClassMap> {
  let classMap: ClassMap;

  return new Promise((resolve) => {
    fs.createReadStream(mapPath).pipe(
      JSONStream.parse('events.*')
        .on('header', (obj: any) => {
          classMap = new ClassMap(obj.classMap);
        })
        .on('close', () => {
          resolve(classMap);
        })
    );
  });
}

async function accumulateEvents(mapPath: string): Promise<Array<EventInfo>> {
  const classMap = await parseClassMap(mapPath);
  const events = {};

  return new Promise((resolve) => {
    fs.createReadStream(mapPath).pipe(
      JSONStream.parse('events.*')
        .on('data', (eventData: any) => {
          if (
            eventData.event !== 'call' ||
            eventData.sql_query ||
            eventData.http_server_request ||
            eventData.http_client_request
          ) {
            return;
          }

          const event = new Event(eventData);
          const obj = classMap.codeObjectFromEvent(event);

          if (obj) {
            const fqid = obj.fqid;
            const size = sizeof(event);
            const entry = events[fqid];

            if (entry) {
              entry.size += size;
              entry.count += 1;
            } else {
              events[fqid] = { location: obj.location, size, count: 1 };
            }
          }
        })
        .on('close', () => {
          resolve(
            Object.keys(events)
              .map((key) => {
                const { location, size, count } = events[key];
                return { fqid: key, count, size, location };
              })
              .sort((a, b) => b.count - a.count)
          );
        })
    );
  });
}

export async function statsForMap(
  format: string,
  limit: number,
  mapPath: string
): Promise<Array<EventInfo>> {
  const eventsStats = (await accumulateEvents(mapPath)).slice(0, limit);

  if (format === 'json') {
    console.log(JSON.stringify(eventsStats, null, 2));
  } else {
    eventsStats.forEach((callData, index) => {
      const { fqid, count, size } = callData;
      console.log(
        [
          `${index + 1}. ${fqid}`,
          `count: ${count}`,
          `estimated size: ${displaySize(size)}`,
          '',
        ].join('\n      ')
      );
    });
  }

  return eventsStats;
}
