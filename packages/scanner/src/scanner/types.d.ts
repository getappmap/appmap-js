interface TimeAllowed {
  timeAllowed?: number;
}

interface WarningLimit {
  warningLimit?: number;
}

export namespace IllegalPackageDependency {
  export interface Options {
    allowedPackages: string[];
  }
}

export namespace CircularDependency {
  export interface Options {
    ignoredPackages?: string[];
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
    includeContentTypes?: string[];
    excludeContentTypes?: string[];
  }
}

export namespace NPlusOneQuery {
  export interface Options extends WarningLimit {
    errorLimit?: number;
  }
}

export namespace QueryFromInvalidPackage {
  export interface Options {
    allowedPackages: string[];
    skipQueries?: string[];
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
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Options extends TimeAllowed {}
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
