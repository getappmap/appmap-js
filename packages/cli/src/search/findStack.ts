import { buildAppMap, CodeObject, Event } from '@appland/models';
import { readFile } from 'fs/promises';
import { inspect } from 'util';
import { verbose } from '../utils';
import LocationMap from './locationMap';
import SearchResultHashV2 from './searchResultHashV2';

export type FindStackMatch = {
  appmap: string;
  eventIds: number[];
  score: number;
  hash_v2: string;
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
    const locationMap = new LocationMap(appmap.classMap);

    const locationStack = [...this.stackLines];
    if (verbose())
      console.log(`Searching for stack: ${inspect(locationStack)}`);
    const result: FindStackMatch[] = [];
    let score: number[] = [];
    let stack: Event[] = [];

    const enter = (event: Event): boolean | undefined => {
      let matchIndex: number | undefined;
      if (event.path && event.lineno) {
        if (verbose())
          console.log(
            `${stack.map((_) => '  ').join('')}${event.path}:${event.lineno}`
          );
        for (
          let i = 0;
          matchIndex === undefined && i < locationStack.length;
          i++
        ) {
          const [stackLinePath, stackLineLineno] = locationStack[i].split(
            ':',
            2
          );

          if (stackLinePath === event.path)
            locationMap.functionContainsLine(
              stackLinePath,
              event.lineno,
              parseFloat(stackLineLineno)
            );

          if (
            stackLinePath === event.path &&
            locationMap.functionContainsLine(
              stackLinePath,
              event.lineno,
              parseFloat(stackLineLineno)
            )
          ) {
            matchIndex = i;
          }
        }
      }

      stack.push(event);
      if (matchIndex !== undefined) {
        if (verbose())
          console.log(
            `${stack.map((_) => '  ').join('')}Matched ${
              locationStack[matchIndex]
            } at event ${event.id} (${event.codeObject.fqid})`
          );
        locationStack.splice(0, matchIndex + 1);
        if (verbose())
          console.log(`Now matching stack: ${inspect(locationStack)}`);

        score.push(1);
        if (locationStack.length === 0) {
          return true;
        }
      } else {
        score.push(0);
      }
    };

    const leave = () => {
      stack.pop();
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
            const matchStack = stack.filter((_, index) => score[index]);
            const hash = new SearchResultHashV2(matchStack);
            if (verbose()) console.log(`Match hash: ${hash.canonicalString}`);
            result.push({
              appmap: this.appMapName,
              eventIds: matchStack.map((e) => e.id),
              hash_v2: hash.digest(),
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
