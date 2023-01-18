export type ExclusionExt = {
  path: string;
  methods: string[];
};

export type Exclusion = string | ExclusionExt;

export interface ConfigOpenApi {
  overrides?: Record<string, any>;
  schemas?: any; // TODO: This type should be more specific, but I don't know what it is.
  ignore?: Array<Exclusion>;
}

export enum ExclusionMatch {
  NoMatch,
  Inherit,
  Exclude,
  Include,
}

function matchMethod(exclusion: Exclusion, method: string): ExclusionMatch {
  if (typeof exclusion === 'string') {
    return ExclusionMatch.Inherit;
  }

  let isNegated = false;
  for (const excludedMethod of exclusion.methods) {
    isNegated = excludedMethod.startsWith('!');
    if (isNegated && excludedMethod.substring(1).toLowerCase() === method.toLowerCase()) {
      return ExclusionMatch.Include;
    }

    if (excludedMethod.toLowerCase() === method.toLowerCase()) {
      return ExclusionMatch.Exclude;
    }
  }

  return isNegated ? ExclusionMatch.Exclude : ExclusionMatch.NoMatch;
}

const escapeRegex = (str) => str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
const toGlobRegex = (str) => str.replace(/\*+/g, '(.*)');
const matchesGlob = (test, pattern) => test.match(toGlobRegex(escapeRegex(pattern))) !== null;

function matchRoute(exclude: Exclusion, route: string): ExclusionMatch {
  let path = typeof exclude === 'string' ? exclude : exclude.path;
  const isNegated = path.startsWith('!');
  if (isNegated) {
    return matchesGlob(route, path.substring(1)) ? ExclusionMatch.Include : ExclusionMatch.NoMatch;
  }

  return matchesGlob(route, path) ? ExclusionMatch.Exclude : ExclusionMatch.NoMatch;
}

function validateExclusions(exclusions: ReadonlyArray<Exclusion>): void {
  exclusions.forEach((exclusion) => {
    if (typeof exclusion === 'string') {
      return;
    }

    if (exclusion.methods && !Array.isArray(exclusion.methods)) {
      throw new Error(
        `Invalid methods. Expected array, got ${typeof exclusion}: ${JSON.stringify(exclusion)})}`
      );
    }

    let includesMethods = false;
    let excludesMethods = false;
    for (const method of exclusion.methods) {
      if (method.startsWith('!')) {
        excludesMethods = true;
      } else {
        includesMethods = true;
      }
    }

    if (includesMethods && excludesMethods) {
      throw new Error(
        `Invalid methods. Cannot mix include and exclude: ${JSON.stringify(exclusion)})}`
      );
    }
  });
}

export function match(
  exclusions: ReadonlyArray<Exclusion>,
  route: string,
  method: string
): ExclusionMatch {
  validateExclusions(exclusions);

  const results = exclusions
    .map((exclusion) => {
      const pathMatch = matchRoute(exclusion, route);
      if (pathMatch === ExclusionMatch.NoMatch) {
        return ExclusionMatch.NoMatch;
      }

      const methodMatch = matchMethod(exclusion, method);
      if (methodMatch === ExclusionMatch.Inherit) {
        return pathMatch;
      }

      return methodMatch;
    })
    .filter((result) => result !== ExclusionMatch.NoMatch);

  return results.pop() || ExclusionMatch.NoMatch;
}
