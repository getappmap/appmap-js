import MatchPatternConfig from '../configuration/types/matchPatternConfig';

interface TimeAllowed {
  timeAllowed?: number;
}

interface WarningLimit {
  warningLimit?: number;
}

export namespace IllegalPackageDependency {
  export interface Options {
    callerPackages: MatchPatternConfig[];
    calleePackage: MatchPatternConfig;
  }
}

export namespace CircularDependency {
  export interface Options {
    ignoredPackages?: MatchPatternConfig[];
    depth?: number;
  }
}

export namespace IncompatibleHttpClientRequest {
  export interface Options {
    schemata: Record<string, string>;
  }
}

export namespace MissingAuthentication {
  export interface Options {
    includeContentTypes?: MatchPatternConfig[];
    excludeContentTypes?: MatchPatternConfig[];
  }
}

export namespace NPlusOneQuery {
  export interface Options extends WarningLimit {
    errorLimit?: number;
  }
}

export namespace QueryFromInvalidPackage {
  export interface Options {
    allowedPackages: MatchPatternConfig[];
    allowedQueries?: MatchPatternConfig[];
  }
}

export namespace QueryFromView {
  export interface Options {
    forbiddenLabel?: string;
  }
}

export namespace RPCWithoutCircuitBreaker {
  export interface Options {
    expectedLabel?: string;
  }
}

export namespace SlowFunctionCall {
  export interface Options extends TimeAllowed {
    functions?: MatchPatternConfig[];
  }
}

export namespace SlowHTTPServerRequest {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Options extends TimeAllowed {}
}

export namespace SlowQuery {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Options extends TimeAllowed {}
}

export namespace TooManyJoins {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Options extends WarningLimit {}
}

export namespace TooManyUpdates {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Options extends WarningLimit {}
}
