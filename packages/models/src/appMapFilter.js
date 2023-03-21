import buildAppMap from './appMapBuilder';
import AppMap from './appMap';
import CodeObject from './codeObject';

class DeclutterProperty {
  on = true;
  default = true;

  constructor(on = true, defaultValue = true) {
    this.on = on;
    this.default = defaultValue;
  }
}

class DeclutterTimeProperty extends DeclutterProperty {
  time = 100;

  constructor(on = true, defaultValue = true, time = 100) {
    super(on, defaultValue);

    this.time = time;
  }
}

class DeclutterNamesProperty extends DeclutterProperty {
  names = [];

  constructor(on = true, defaultValue = true, names = []) {
    super(on, defaultValue);

    this.names = names;
  }
}

class Declutter {
  limitRootEvents = new DeclutterProperty();
  hideMediaRequests = new DeclutterProperty();
  hideExternalPaths = new DeclutterProperty(false, false);
  hideUnlabeled = new DeclutterProperty(false, false);
  hideElapsedTimeUnder = new DeclutterTimeProperty(false, false, 100);
  hideName = new DeclutterNamesProperty(false, false, []);
}

const FilterRegExps = {};
function filterRegExp(filterExpression, regexpConstructorArgs) {
  if (!FilterRegExps[filterExpression])
    FilterRegExps[filterExpression] = new RegExp(...regexpConstructorArgs());

  return FilterRegExps[filterExpression];
}

function isAbsolute(path) {
  if (!path) return false;

  if (path.length === 0) return false;

  if (['/', '\\'].includes(path.charAt(0))) return true;

  if (/^[a-zA-Z]:[\\/]/.test(path)) return true;

  return false;
}

export function isLocalPath(location) {
  if (!location) return { isLocal: false };

  if (!location.includes(':')) return { isLocal: false };

  const path = location.split(':')[0];
  if (path.match(/\.\w+$/) && !isAbsolute(path)) return { isLocal: true, path };

  return { isLocal: false };
}

export default class AppMapFilter {
  rootObjects = [];
  declutter = new Declutter();

  /**
   *
   * @param {AppMap} appMap
   * @param {any[]} findings
   * @returns {AppMap}
   */
  filter(appMap, findings) {
    const { classMap } = appMap;

    let { events } = appMap;

    if (this.rootObjects.length) {
      let eventBranches = [];

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

    if (this.declutter.limitRootEvents.on) {
      const includeEvents = new Set();
      const httpServerRequestStack = [];
      const markIncludedEvents = (e) => {
        if (e.isCall() && e.httpServerRequest) httpServerRequestStack.push(e);
        if (httpServerRequestStack.length > 0) includeEvents.add(e.id);
        if (e.isReturn() && e.httpServerResponse) httpServerRequestStack.pop();
      };
      appMap.events.forEach(markIncludedEvents);
      if (includeEvents.size > 0) events = appMap.events.filter((e) => includeEvents.has(e.id));
    }

    if (this.declutter.hideMediaRequests.on) {
      events = AppMapFilter.filterMediaRequests(events);
    }

    if (this.declutter.hideUnlabeled.on) {
      events = events.filter((e) => e.labels.size > 0 || e.codeObject.type !== 'function');
    }

    if (this.declutter.hideExternalPaths.on) {
      events = events.filter((e) => isLocalPath(e.codeObject.location).isLocal);
    }

    if (this.declutter.hideElapsedTimeUnder.on && this.declutter.hideElapsedTimeUnder.time > 0) {
      events = events.filter(
        (e) => e.elapsedTime && e.elapsedTime >= this.declutter.hideElapsedTimeUnder.time / 1000
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

  /**
   *
   * @param {Event[]} events
   * @returns Event[]
   */
  static filterMediaRequests(events) {
    const excludedEvents = [];
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
        let mimeType;
        const { headers } = httpServerResponse;

        if (headers) {
          const contentTypeKey = Object.keys(headers).filter(
            (k) => k.toLowerCase() === 'content-type'
          )[0];

          mimeType = headers[contentTypeKey];
        } else {
          mimeType = httpServerResponse.mime_type; // 'mime_type' is no longer supported in the AppMap data standard, but we should keep this code for backward compatibility
        }

        if (mimeType && e.parentId && mediaRegex.some((regex) => regex.test(mimeType))) {
          excludedEvents.push(e.parentId);
        }
      }
    });

    return events.filter((e) => !excludedEvents.includes(e.id));
  }

  /**
   *
   * @param {CodeObject} object
   * @param {string} query
   * @returns boolean
   */
  static codeObjectIsMatched(object, query) {
    if (query.startsWith('label:')) {
      const pattern = filterRegExp(query, () => [
        `^${query.replace('label:', '').replace('*', '.*')}$`,
        'ig',
      ]);
      return Array.from(object.labels).some((label) => pattern.test(label));
    }
    if (query.length > 2 && query.charAt(0) === '/' && query.charAt(query.length - 1) === '/') {
      const pattern = filterRegExp(query, () => [query.substring(1, query.length - 1), 'ig']);
      if (pattern.test(object.fqid)) {
        return true;
      }
    }
    if (query.includes('*')) {
      const pattern = filterRegExp(query, () => [`^${query.replace('*', '.*')}$`, 'ig']);
      if (pattern.test(object.fqid)) {
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
  static attachFindingsToEvents(events, findings) {
    const eventsById = events.reduce((map, e) => {
      map[e.id] = e.callEvent;
      return map;
    }, {});

    findings.forEach((finding) => {
      const traceFilter =
        finding.appMapUri && finding.appMapUri.fragment && finding.appMapUri.fragment.traceFilter;

      if (traceFilter) {
        const ids = traceFilter.split(' ').map((idStr) => Number(idStr.split(':')[1]));

        ids.forEach((id) => {
          const event = eventsById[id];

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

  apply(filterState) {
    if ('rootObjects' in filterState) {
      this.declutter.rootObjects = filterState.rootObjects;
    }
    if ('limitRootEvents' in filterState) {
      this.declutter.limitRootEvents.on = filterState.limitRootEvents;
    }
    if ('hideMediaRequests' in filterState) {
      this.declutter.hideMediaRequests.on = filterState.hideMediaRequests;
    }
    if ('hideUnlabeled' in filterState) {
      this.declutter.hideUnlabeled.on = filterState.hideUnlabeled;
    }
    if ('hideExternalPaths' in filterState) {
      this.declutter.hideExternalPaths.on = filterState.hideExternalPaths;
    }
    if ('hideElapsedTimeUnder' in filterState && filterState.hideElapsedTimeUnder !== false) {
      this.declutter.hideElapsedTimeUnder.on = true;
      this.declutter.hideElapsedTimeUnder.time = filterState.hideElapsedTimeUnder;
    }
    if ('hideName' in filterState && filterState.hideName !== false) {
      this.declutter.hideName.on = true;
      this.declutter.hideName.names = filterState.hideName;
    }
  }

  static eventAlreadyHasFinding(event, finding) {
    return (
      event.findings &&
      !!event.findings.find(
        (attachedFinding) => attachedFinding.finding.hash_v2 === finding.finding.hash_v2
      )
    );
  }
}
