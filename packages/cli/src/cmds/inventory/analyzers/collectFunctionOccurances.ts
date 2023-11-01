import { EventInfo, accumulateEvents } from '../../stats/accumulateEvents';

export default function collectFunctionOccurances(functionOccurrances: Record<string, EventInfo>) {
  return async (appmap: string) => {
    const eventInfos = await accumulateEvents(appmap);
    for (const eventInfo of eventInfos) {
      if (!functionOccurrances[eventInfo.function]) {
        functionOccurrances[eventInfo.function] = eventInfo;
      } else {
        const existing = functionOccurrances[eventInfo.function];
        existing.count += eventInfo.count;
        existing.size += eventInfo.size;
      }
    }
  };
}
