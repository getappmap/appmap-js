import * as fs from 'fs';
import { ClassMap, Event } from '@appland/models';
import JSONStream from 'JSONStream';

const sizeof = (obj: any): number => JSON.stringify(obj).length;

export type EventInfo = {
  function: string;
  count: number;
  size: number;
  location: string;
};

async function parseClassMap(mapPath: string): Promise<ClassMap> {
  let classMap: ClassMap;

  return new Promise((resolve) => {
    fs.createReadStream(mapPath).pipe(
      JSONStream.parse('events.*')
        .on('header', (obj: any) => {
          if (obj.classMap) classMap = new ClassMap(obj.classMap);
        })
        .on('footer', (obj: any) => {
          if (obj.classMap) classMap = new ClassMap(obj.classMap);
        })
        .on('close', () => {
          resolve(classMap);
        })
    );
  });
}

export async function accumulateEvents(mapPath: string): Promise<Array<EventInfo>> {
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
                return { function: key, count, size, location };
              })
              .sort((a, b) => b.count - a.count)
          );
        })
    );
  });
}
