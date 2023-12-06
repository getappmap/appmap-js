import buildAppMap from './appMapBuilder';
import AppMap from './appMap';
import CodeObject from './codeObject';
import { isLocalPath } from './util';

export const DEFAULT_CONTEXT_DEPTH = 1;

class DeclutterProperty {
  on = true;
  default = true;

  constructor(on = true, defaultValue = true) {
    this.on = on;
    this.default = defaultValue;
  }
}

class DeclutterTimeProperty extends DeclutterProperty {
  DEFAULT_TIME = 100;

  time = this.DEFAULT_TIME;

  constructor(on = true, defaultValue = true, time = DeclutterTimeProperty.DEFAULT_TIME) {
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

class DeclutterContextNamesProperty extends DeclutterNamesProperty {
  depth = DEFAULT_CONTEXT_DEPTH;

  constructor(on = true, defaultValue = true, names = [], depth = undefined) {
    super(on, defaultValue, names);

    if (depth !== undefined) this.depth = depth;
  }
}

// Directories inside the project tree that may contain bundled dependencies.
const DependencyFolders = ['vendor', 'node_modules'];

class DeclutterExternalPathsProperty extends DeclutterProperty {
  dependencyFolders = DependencyFolders;

  constructor(on = false, defaultValue = false, dependencyFolders = DependencyFolders) {
    super(on, defaultValue);

    this.dependencyFolders = dependencyFolders || DependencyFolders;
  }
}

const ROOT_EVENT_LABELS = ['cli.command', 'job.perform', 'message.handle'];

class Declutter {
  limitRootEvents = new DeclutterProperty();
  hideMediaRequests = new DeclutterProperty();
  hideExternalPaths = new DeclutterExternalPathsProperty();
  hideUnlabeled = new DeclutterProperty(false, false);
  hideElapsedTimeUnder = new DeclutterTimeProperty(false, false, 1);
  hideName = new DeclutterNamesProperty(false, false, []);
  hideTree = new DeclutterNamesProperty(false, false, []);
  context = new DeclutterContextNamesProperty(false, false, []);
}

const FilterRegExps = {};
function filterRegExp(filterExpression, regexpConstructorArgs) {
  if (!FilterRegExps[filterExpression])
    FilterRegExps[filterExpression] = new RegExp(...regexpConstructorArgs());

  return FilterRegExps[filterExpression];
}

// events: Array of events to process.
// filterFn: A test function to apply to each event. If the function returns true, the event is
//   included in the result. If an ancestor of a descendant event has matched the filterFn, and distance to the
//   ancestor is within the maxDepth, then the descendant is included as well.
// maxDepth: The maximum depth of a descendant event to include. If undefined, all descendants are included.
// Returns: A set of events that matched the filterFn.
function markSubtrees(events, filterFn, maxDepth) {
  const matchingEvents = new Set();

  // Collect all 'call' events that match explicitly.
  events.filter((e) => e.isCall() && filterFn(e)).forEach((e) => matchingEvents.add(e));

  // Match all descendants of matching events, down to maxDepth.
  const matchDescendant = (e, depth) => {
    // Already marked before by some other traversal.
    if (matchingEvents.has(e)) return;

    // Below the maxDepth.
    if (maxDepth !== undefined && depth > maxDepth) return;

    matchingEvents.add(e);
    if (e.children) e.children.forEach((child) => matchDescendant(child, depth + 1));
  };

  [...matchingEvents]
    .filter((e) => e.children)
    .forEach((e) => e.children.forEach((child) => matchDescendant(child, 1)));

  [...matchingEvents].forEach((e) => matchingEvents.add(e.returnEvent));

  return matchingEvents;
}

// Collect all code objects that match a filter expressions.
// Mark all events that are in a subtree whose root is one of the matched code objects.
// Collect all marked events.
// This filter should run in O(n), assuming set insertion and lookup is constant time.
function includeSubtrees(events, filterFn, applyIfEmpty) {
  const includedEvents = markSubtrees(events, filterFn);

  if (applyIfEmpty || includedEvents.size) return events.filter((e) => includedEvents.has(e));
  else return events;
}

// Collect all code objects that match a filter expressions.
// Mark all events that are in a subtree whose root is one of the matched code objects.
// Collect all unmarked events.
// This filter should run in O(n), assuming set insertion and lookup is constant time.
function excludeSubtrees(events, filterFn) {
  const excludedEvents = markSubtrees(events, filterFn);

  return events.filter((e) => !excludedEvents.has(e));
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

    // Collect all code objects that match a filter expression. When a code object matches an
    // expression, the entire subtree rooted at that code object is included as well.
    function matchCodeObjects(expressions, matchSelf) {
      return classMap.codeObjects.reduce((memo, codeObject) => {
        if (expressions.some((expr) => AppMapFilter.codeObjectIsMatched(codeObject, expr))) {
          codeObject.visit((co) => {
            if (co !== codeObject || matchSelf) memo.add(co);
          });
        }

        return memo;
      }, new Set());
    }

    // Include only subtrees of "command"-type events, unless there are no commands.
    if (this.declutter.limitRootEvents.on) {
      // Return true if the event is a "command". Types of commands recognized by this test include:
      // - HTTP server request - the event has http_server_request data
      // - cli.command - command of a CLI application
      // - job.perform - a background job
      // - message.handle - a handler for a message queue
      //
      // @param {Event} e
      const isCommand = (e) => {
        if (e.httpServerRequest) return true;

        const { labels } = e.codeObject;

        return ROOT_EVENT_LABELS.find((label) => labels.has(label));
      };

      events = includeSubtrees(events, isCommand, false);
    }

    // Include only subtrees of a specified root object. This could also be stored and managed
    // as a declutter filter, but it isn't, for some reason. It works the same way.
    if (this.rootObjects.length) {
      const includeCodeObjects = matchCodeObjects(this.rootObjects, true);
      const filterFn = (e) => includeCodeObjects.has(e.codeObject);

      events = includeSubtrees(events, filterFn, true);
    }

    if (this.declutter.context.on && this.declutter.context.names.length) {
      const includeCodeObjects = matchCodeObjects(this.declutter.context.names, true);
      const filterFn = (e) => includeCodeObjects.has(e.codeObject);

      const subtreeEvents = markSubtrees(events, filterFn, this.declutter.context.depth);
      const ancestorEvents = new Set();
      const includeAncestors = (e, distance = 1) => {
        if (!e) return;

        if (ancestorEvents.has(e)) return;

        if (distance <= this.declutter.context.depth || !e.parent) {
          ancestorEvents.add(e);
          ancestorEvents.add(e.returnEvent);
        }

        if (e.parent) includeAncestors(e.parent, distance + 1);
      };
      events.filter((e) => filterFn(e)).forEach((e) => includeAncestors(e.parent));
      events = events.filter((e) => subtreeEvents.has(e) || ancestorEvents.has(e));
    }

    // Hide descendent events from named, pattern-matched or labeled code objects. The matching
    // event itself is not hidden. To accomplish that, add the same filter to `hideName`.
    if (this.declutter.hideTree.on && this.declutter.hideTree.names.length) {
      const excludeCodeObjects = matchCodeObjects(this.declutter.hideTree.names, false);
      events = excludeSubtrees(events, (e) => excludeCodeObjects.has(e.codeObject));
    }

    // Hide HTTP server requests that fetch a known media type.
    if (this.declutter.hideMediaRequests.on) {
      events = AppMapFilter.filterMediaRequests(events);
    }

    // Hide any unlabeled code object. This is rarely useful.
    if (this.declutter.hideUnlabeled.on) {
      events = events.filter((e) => e.labels.size > 0 || e.codeObject.type !== 'function');
    }

    // Hide code that appears to be sourced from outside the local source tree.
    // This isn't super reliable, because the location path may be inside the project tree
    // even for external code; and the location may be outside the project tree even for code
    // that the user considers to be part of the project.
    if (this.declutter.hideExternalPaths.on) {
      events = events.filter(
        (e) =>
          e.codeObject.type !== 'function' ||
          isLocalPath(e.codeObject.location, this.declutter.hideExternalPaths.dependencyFolders)
            .isLocal
      );
    }

    // Hide code whose elapsed time is less than a specified threshold.
    // This is useful for navigating down a call tree looking for expensive code.
    if (this.declutter.hideElapsedTimeUnder.on && this.declutter.hideElapsedTimeUnder.time > 0) {
      events = events.filter(
        (e) => e.elapsedTime && e.elapsedTime >= this.declutter.hideElapsedTimeUnder.time / 1000
      );
    }

    // Hide events from named, pattern-matched or labeled code objects. Hiding does not apply to
    // sub-events of matching events.
    if (this.declutter.hideName.on && this.declutter.hideName.names.length) {
      const excludeCodeObjects = matchCodeObjects(this.declutter.hideName.names, true);
      events = events.filter((e) => !excludeCodeObjects.has(e.codeObject));
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

    // TODO It would be even better to exclude the whole subtree, in case the media request is handled by user code.
    return events.filter((e) => !excludedEvents.includes(e.id));
  }

  /**
   *
   * @param {CodeObject} object
   * @param {string} query
   * @returns boolean
   */
  static codeObjectIsMatched(object, query) {
    if (query === object.fqid) {
      return true;
    } else if (query.startsWith('label:')) {
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
    } else if (query.endsWith('*')) {
      const pattern = filterRegExp(query, () => [`^${query.slice(0, query.length - 1)}.*`, 'ig']);
      if (pattern.test(object.fqid)) {
        return true;
      }
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

  static eventAlreadyHasFinding(event, finding) {
    return (
      event.findings &&
      !!event.findings.find(
        (attachedFinding) => attachedFinding.finding.hash_v2 === finding.finding.hash_v2
      )
    );
  }
}
