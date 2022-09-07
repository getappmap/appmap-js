import { buildAppMap, Event } from '@appland/models';
import { readFile } from 'fs/promises';

export type FindStackMatch = {
  appmap: string;
  codeObjectId: string;
  eventId: number;
  score: number;
};

export default class FindStack {
  constructor(public appMapName: string, public stackLines: string[]) {}

  async match(): Promise<FindStackMatch[]> {
    const appmapFile = [this.appMapName, 'appmap.json'].join('.');

    let appmapData: string;
    try {
      appmapData = JSON.parse(await readFile(appmapFile, 'utf-8'));
    } catch (e) {
      console.log((e as any).code);
      console.warn(`Error loading ${appmapFile}: ${e}`);
      return [];
    }

    const appmap = buildAppMap(appmapData).build();
    const locationStack = [...this.stackLines];
    const result: FindStackMatch[] = [];
    let score: number[] = [];

    const enter = (event: Event): boolean | undefined => {
      const eventLocation = [event?.path, event?.lineno]
        .filter(Boolean)
        .join(':');
      let matchIndex: number | undefined;
      if (eventLocation && eventLocation !== '') {
        for (
          let i = 0;
          matchIndex === undefined && i < locationStack.length;
          i++
        ) {
          const stackLine = locationStack[i];
          if (eventLocation === stackLine) {
            matchIndex = i;
          }
        }
      }

      if (matchIndex !== undefined) {
        locationStack.splice(0, matchIndex + 1);
        score.push(1);
        if (locationStack.length === 0) {
          return true;
        }
      } else {
        score.push(0);
      }
    };

    const leave = () => {
      score.pop();
    };

    for (let i = 0; i < appmap.events.length; ) {
      const event = appmap.events[i];
      if (event.isCall()) {
        const isFullMatch = enter(event);
        const isLeaf = event.children.length === 0;
        if (isFullMatch || isLeaf) {
          const total = score.reduce((sum, n) => (n ? sum + n : sum));
          if (total > 0) {
            result.push({
              appmap: this.appMapName,
              eventId: event.id,
              codeObjectId: event.codeObject.fqid,
              score: total,
            });
          }
        }
        if (isFullMatch) {
          for (++i; appmap.events[i] !== event.returnEvent; ++i) {}
        } else {
          ++i;
        }
      } else {
        ++i;
        leave();
      }
    }

    return result;
  }
}
