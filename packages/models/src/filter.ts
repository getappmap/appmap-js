import { AppMap, Event, buildAppMap, CodeObject } from '@appland/models';

export class Declutter {
  public limitRootEventsToHTTP = true;
  public hideMediaRequests = true;
  public hideUnlabeled = false;
  public hideElapsedTimeUnder: number | undefined;
  public hideName: string[] | undefined;
}

type EventId = number;

export default class Filter {
  public declutter: Declutter = new Declutter();
  public rootObjects: string[] = [];

  filterAppMap(appMap: AppMap): AppMap {
    const { classMap } = appMap;
    let rootEvents = appMap.rootEvents();

    const collectHttpServerRequests = (event: Event, result: Event[] = []): Event[] => {
      if (event.httpServerRequest) {
        result.push(event);
        return result;
      }

      event.children.forEach((e) => collectHttpServerRequests(e, result));
      return result;
    };

    if (this.declutter.limitRootEventsToHTTP) {
      const httpServerRequests = rootEvents.reduce<Event[]>(
        (accumulator, e) => accumulator.concat(collectHttpServerRequests(e)),
        []
      );
      if (httpServerRequests.length > 0) {
        rootEvents = httpServerRequests;
      }
    }

    let events = rootEvents.reduce<Event[]>((callTree, rootEvent) => {
      rootEvent.traverse((e) => callTree.push(e));
      return callTree;
    }, []);

    if (this.rootObjects.length) {
      let eventBranches: [EventId, EventId][] = [];

      classMap.codeObjects.forEach((codeObject) => {
        this.rootObjects.forEach((id) => {
          if (this.codeObjectIsMatched(codeObject, id)) {
            eventBranches = eventBranches.concat(
              codeObject.allEvents.map((e) => [e.id, e.linkedEvent.id])
            );
          }
        });
      });

      if (eventBranches.length) {
        events = events.filter((e) =>
          eventBranches.some((branch) => e.id >= branch[0] && e.id <= branch[1])
        );
      }
    }

    if (this.declutter.hideMediaRequests) {
      events = this.filterMediaRequests(events);
    }

    if (this.declutter.hideUnlabeled) {
      events = events.filter((e) => e.labels.size > 0 || e.codeObject.type !== 'function');
    }

    const { hideName, hideElapsedTimeUnder } = this.declutter;

    if (hideElapsedTimeUnder !== undefined && hideElapsedTimeUnder > 0) {
      events = events.filter(
        (e) =>
          e.returnEvent &&
          e.returnEvent.elapsedTime &&
          e.returnEvent.elapsedTime >= hideElapsedTimeUnder / 1000
      );
    }

    if (hideName !== undefined && hideName.length) {
      classMap.codeObjects.forEach((codeObject) => {
        hideName.forEach((fqid) => {
          if (this.codeObjectIsMatched(codeObject, fqid)) {
            events = events.filter((e) => !codeObject.allEvents.includes(e));
          }
        });
      });
    }

    const eventIds = new Set(events.filter((e) => e.isCall()).map((e) => e.id));

    return buildAppMap({
      events: events.filter((e) => eventIds.has(e.id) || (e.parentId && eventIds.has(e.parentId))),
      classMap: JSON.parse(JSON.stringify(classMap.toJSON())),
      metadata: appMap.metadata,
    }).build();
  }

  private filterMediaRequests(events: Event[]): Event[] {
    const excludedEvents: EventId[] = [];
    const mediaRegex = [
      'application/javascript',
      'application/ecmascript',
      'audio/.+',
      'font/.+',
      'image/.+',
      'text/javascript',
      'text/ecmascript',
      'text/css',
      'video/.+',
    ].map((t) => new RegExp(t, 'i'));
    const mediaFileExtensions = new Set([
      'aac',
      'avi',
      'bmp',
      'css',
      'flv',
      'gif',
      'htm',
      'html',
      'ico',
      'jpeg',
      'jpg',
      'js',
      'json',
      'jsonld',
      'mid',
      'midi',
      'mjs',
      'mov',
      'mp3',
      'mp4',
      'mpeg',
      'oga',
      'ogg',
      'ogv',
      'ogx',
      'opus',
      'otf',
      'png',
      'svg',
      'tif',
      'tiff',
      'ts',
      'ttf',
      'wav',
      'weba',
      'webm',
      'webp',
      'woff',
      'woff2',
      'xhtml',
      '3gp',
      '3g2',
    ]);

    events.forEach((e) => {
      const { requestContentType } = e;
      if (e.requestMethod === 'GET' && e.requestPath) {
        const pathExt = e.requestPath.match(/.*\.([\S]*)$/);
        if (pathExt && mediaFileExtensions.has(pathExt[1])) {
          excludedEvents.push(e.id);
        }
      } else if (requestContentType) {
        if (mediaRegex.some((regex) => regex.test(requestContentType))) {
          if (e.parentId) {
            excludedEvents.push(e.parentId);
          }
        }
      }
    });

    return events.filter((e) => !excludedEvents.includes(e.id));
  }

  private codeObjectIsMatched(object: CodeObject, query: string): boolean {
    if (query.startsWith('label:')) {
      const labelRegExp = new RegExp(`^${query.replace('label:', '').replace('*', '.*')}$`, 'ig');
      return Array.from(object.labels).some((label) => labelRegExp.test(label));
    }
    if (query.includes('*')) {
      const filterRegExp = new RegExp(`^${query.replace('*', '.*')}$`, 'ig');
      if (filterRegExp.test(object.fqid)) {
        return true;
      }
    } else if (query === object.fqid) {
      return true;
    }
    return false;
  }
}
