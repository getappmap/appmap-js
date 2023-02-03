import { AppMap, buildAppMap, CodeObject, Event } from '@appland/models';

type DeclutterProperty = {
  on: boolean;
  default: boolean;
};

type DeclutterTimeProperty = DeclutterProperty & {
  time: number;
};

type DeclutterNamesProperty = DeclutterProperty & {
  names: [];
};

export class Declutter {
  public limitRootEvents: DeclutterProperty = {
    on: true,
    default: true,
  };
  public hideMediaRequests: DeclutterProperty = {
    on: true,
    default: true,
  };
  public hideUnlabeled: DeclutterProperty = {
    on: false,
    default: false,
  };
  public hideElapsedTimeUnder: DeclutterTimeProperty = {
    on: false,
    default: false,
    time: 100,
  };
  public hideName: DeclutterNamesProperty = {
    on: false,
    default: false,
    names: [],
  };
}

export default class AppMapFilter {
  public rootObjects = [];
  public declutter = new Declutter();

  constructor() {}

  filter(appMap: AppMap, findings: any[]): AppMap {
    const { classMap } = appMap;
    let rootEvents = appMap.rootEvents();

    if (this.declutter.limitRootEvents.on) {
      rootEvents = rootEvents.filter((e) => e.httpServerRequest);
    }

    let events = rootEvents.reduce((callTree, rootEvent) => {
      rootEvent.traverse((e) => callTree.push(e));
      return callTree;
    }, new Array<Event>());

    if (this.rootObjects.length) {
      let eventBranches: [eventId: number, linkedEventId: number][] = [];

      classMap.codeObjects.forEach((codeObject) => {
        this.rootObjects.forEach((id) => {
          if (AppMapFilter.codeObjectIsMatched(codeObject, id)) {
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

    if (this.declutter.hideMediaRequests.on) {
      events = AppMapFilter.filterMediaRequests(events);
    }

    if (this.declutter.hideUnlabeled.on) {
      events = events.filter((e) => e.labels.size > 0 || e.codeObject.type !== 'function');
    }

    if (this.declutter.hideElapsedTimeUnder.on && this.declutter.hideElapsedTimeUnder.time > 0) {
      events = events.filter(
        (e) =>
          e.returnEvent &&
          e.returnEvent.elapsedTime &&
          e.returnEvent.elapsedTime >= this.declutter.hideElapsedTimeUnder.time / 1000
      );
    }

    if (this.declutter.hideName.on && this.declutter.hideName.names.length) {
      classMap.codeObjects.forEach((codeObject) => {
        this.declutter.hideName.names.forEach((fqid) => {
          if (AppMapFilter.codeObjectIsMatched(codeObject, fqid)) {
            events = events.filter((e) => !codeObject.allEvents.includes(e));
          }
        });
      });
    }

    const eventIds = new Set(events.filter((e) => e.isCall()).map((e) => e.id));

    if (findings && findings.length > 0) {
      findings.forEach((finding) => {
        if (
          finding.appMapUri &&
          finding.appMapUri.fragment &&
          typeof finding.appMapUri.fragment === 'string'
        ) {
          finding.appMapUri.fragment = JSON.parse(finding.appMapUri.fragment);
        }
      });

      events = AppMapFilter.attachFindingsToEvents(events, findings);
    }

    return buildAppMap({
      events: events.filter((e) => eventIds.has(e.id) || (e.parentId && eventIds.has(e.parentId))),
      classMap: classMap.roots.map((c) => ({ ...c.data })),
      metadata: appMap.metadata,
    }).build();
  }

  static filterMediaRequests(events: Event[]): Event[] {
    const excludedEvents: number[] = [];
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
      const { httpServerResponse } = e;
      if (e.requestMethod === 'GET' && e.requestPath) {
        const pathExt = e.requestPath.match(/.*\.([\S]*)$/);
        if (pathExt && mediaFileExtensions.has(pathExt[1])) {
          excludedEvents.push(e.id);
        }
      } else if (httpServerResponse) {
        let mimeType: string | undefined;
        const { headers } = httpServerResponse;

        if (headers) {
          const contentTypeKey = Object.keys(headers).filter(
            (k) => k.toLowerCase() === 'content-type'
          )[0];

          mimeType = headers[contentTypeKey];
        } else {
          mimeType = (httpServerResponse as any).mime_type; // 'mime_type' is no longer supported in the AppMap data standard, but we should keep this code for backward compatibility
        }

        if (mimeType && e.parentId && mediaRegex.some((regex) => regex.test(mimeType!))) {
          excludedEvents.push(e.parentId);
        }
      }
    });

    return events.filter((e) => !excludedEvents.includes(e.id));
  }

  static codeObjectIsMatched(object: CodeObject, query: string): boolean {
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

  // Regarding untyped 'findings' - Finding is declared in @appland/scanner, but I'm not going to
  // add a dependency on that package just yet. All the code in this file was originally located
  // in VsCodeExtension, and as a first step I'm just refactoring it out.
  static attachFindingsToEvents(events: Event[], findings: any[]) {
    const eventsById = events.reduce((map, e) => {
      map[e.id] = e.callEvent;
      return map;
    }, {} as Record<number, Event>);

    findings.forEach((finding) => {
      const traceFilter: string =
        finding.appMapUri && finding.appMapUri.fragment && finding.appMapUri.fragment.traceFilter;

      if (traceFilter) {
        const ids = traceFilter.split(' ').map((idStr) => Number(idStr.split(':')[1]));

        ids.forEach((id) => {
          const event = eventsById[id] as any;

          if (event && !AppMapFilter.eventAlreadyHasFinding(event, finding)) {
            if (event.findings) {
              event.findings.push(finding);
            } else {
              event.findings = [finding];
            }
          }
        });
      }
    });

    return events;
  }

  static eventAlreadyHasFinding(event: any, finding: any): boolean {
    return (
      event.findings &&
      !!event.findings.find(
        (attachedFinding: any) => attachedFinding.finding.hash_v2 === finding.finding.hash_v2
      )
    );
  }
}
