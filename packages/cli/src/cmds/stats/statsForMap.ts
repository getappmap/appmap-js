import { EventInfo, accumulateEvents } from './accumulateEvents';

const KILOBYTE = 1000;
const MEGABYTE = KILOBYTE * 1000;
const GIGABYTE = MEGABYTE * 1000;

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

export async function statsForMap(
  format: string,
  limit: number,
  mapPath: string
): Promise<EventInfo[]> {
  const eventsStats = (await accumulateEvents(mapPath)).slice(0, limit);

  if (format === 'json') {
    console.log(JSON.stringify(eventsStats, null, 2));
  } else {
    eventsStats.forEach((callData, index) => {
      const { function: fn, count, size } = callData;
      console.log(
        [`${index + 1}. ${fn}`, `count: ${count}`, `estimated size: ${displaySize(size)}`, ''].join(
          '\n      '
        )
      );
    });
  }

  return eventsStats;
}
