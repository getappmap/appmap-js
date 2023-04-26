import AppMapFilter from './appMapFilter';
import { base64UrlDecode } from './util';

function mergeLists(a, b) {
  if (a === false && b === false) return false;

  const result = [...new Set([...(a || []), ...(b || [])])].sort((a, b) => a.localeCompare(b));
  return result.length > 0 ? result : false;
}

function lowestNumber(...sequence) {
  sequence = sequence.filter((t) => t !== undefined && t !== null && t !== false);

  if (sequence.length === 0) return false;

  return Math.min(
    ...sequence
      .map((t) => (typeof t === 'number' ? t : parseInt(t.toString(), 10)))
      .filter((t) => !isNaN(t))
  );
}

function coalesce(...sequence) {
  return sequence.find((t) => t !== undefined && t !== null && t !== false);
}

export function mergeFilterState(first, second) {
  return {
    rootObjects: mergeLists(first.rootObjects, second.rootObjects),
    limitRootEvents: coalesce(first.limitRootEvents, second.limitRootEvents),
    hideMediaRequests: coalesce(first.hideMediaRequests, second.hideMediaRequests),
    hideUnlabeled: coalesce(first.hideUnlabeled, second.hideUnlabeled),
    hideExternal: coalesce(first.hideExternal, second.hideExternal),
    dependencyFolders: mergeLists(first.dependencyFolders, second.dependencyFolders),
    hideElapsedTimeUnder: lowestNumber(first.hideElapsedTimeUnder, second.hideElapsedTimeUnder),
    hideName: mergeLists(first.hideName, second.hideName),
  };
}

// Serialize the AppMapFilter to an object.
export function serializeFilter(filter) {
  if (!filter) return {};

  let declutter = filter;
  if ('declutter' in filter) declutter = filter.declutter;

  return Object.entries({
    rootObjects: declutter.rootObjects,
    limitRootEvents: declutter.limitRootEvents.on,
    hideMediaRequests: declutter.hideMediaRequests.on,
    hideUnlabeled: declutter.hideUnlabeled.on,
    hideExternal: declutter.hideExternalPaths.on,
    dependencyFolders: declutter.hideExternalPaths.on
      ? declutter.hideExternalPaths.dependencyFolders
      : false,
    hideElapsedTimeUnder: declutter.hideElapsedTimeUnder.on
      ? declutter.hideElapsedTimeUnder.time
      : false,
    hideName: declutter.hideName.on ? declutter.hideName.names : false,
  }).reduce((memo, [k, v]) => {
    const filter = declutter[k];
    if (Array.isArray(v) && v.length !== 0) {
      memo[k] = v;
    } else if (filter && filter.default !== v) {
      memo[k] = v;
    }
    return memo;
  }, {});
}

// If stringInput is a base64 URL encoded string, decode it. Parse as JSON into a FilterState object.
export function filterStringToFilterState(stringInput) {
  if (!stringInput) return;

  let json;
  const isStringifiedJson = stringInput.trimStart().startsWith('{');
  if (isStringifiedJson) {
    // The old style of deserialization expected a raw stringified JSON object.
    // To avoid introducing a breaking change, we'll support both for now.
    json = stringInput;
  } else {
    json = base64UrlDecode(stringInput);
  }

  return JSON.parse(json);
}

// Convert a filter string to AppMapFilter. The filter string may optionally be
// base64 URL encoded.
export function deserializeFilter(filterState) {
  if (typeof filterState === 'string') filterState = filterStringToFilterState(filterState);

  const filter = new AppMapFilter();
  if (!filterState) return filter;

  if ('rootObjects' in filterState) {
    filter.declutter.rootObjects = filterState.rootObjects;
  }
  if ('limitRootEvents' in filterState) {
    filter.declutter.limitRootEvents.on = filterState.limitRootEvents;
  }
  if ('hideMediaRequests' in filterState) {
    filter.declutter.hideMediaRequests.on = filterState.hideMediaRequests;
  }
  if ('hideUnlabeled' in filterState) {
    filter.declutter.hideUnlabeled.on = filterState.hideUnlabeled;
  }
  ['hideExternal', 'hideExternalPaths'].forEach((key) => {
    if (key in filterState) {
      filter.declutter.hideExternalPaths.on = filterState[key];
    }
  });
  if ('dependencyFolders' in filterState && filterState.dependencyFolders !== false) {
    filter.declutter.hideExternalPaths.dependencyFolders = filterState.dependencyFolders;
  }
  if ('hideElapsedTimeUnder' in filterState && filterState.hideElapsedTimeUnder !== false) {
    filter.declutter.hideElapsedTimeUnder.on = true;
    filter.declutter.hideElapsedTimeUnder.time = filterState.hideElapsedTimeUnder;
  }
  ['hideName', 'hideNames'].forEach((key) => {
    if (key in filterState && filterState[key] !== false) {
      filter.declutter.hideName.on = true;
      filter.declutter.hideName.names = filterState[key];
    }
  });
  if ('hideTree' in filterState && filterState.hideTree !== false) {
    filter.declutter.hideTree.on = true;
    filter.declutter.hideTree.names = filterState.hideTree;
  }

  return filter;
}
