import AppMapFilter from './appMapFilter';
import { base64UrlDecode } from './util';

// Serialize the AppMapFilter to an object.
export function serializeFilter(filters) {
  const { declutter } = filters;
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
