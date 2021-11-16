interface TimeAllowed {
  timeAllowed?: number;
}

interface WarningLimit {
  warningLimit?: number;
}

export namespace IncompatibleHttpClientRequest {
  export interface Options {
    schemata: Record<string, string>;
  }
}

export namespace IllegalPackageDependency {
  export interface Options {
    selector?: string;
    packageNames?: string[];
  }
}

export namespace MissingAuthentication {
  export interface Options {
    // Allow list of routes to analyze. Default: all routes.
    routes?: string | RegExp[];
    // Allow list of content types to analyze. Default: all content types.
    contentTypes?: string | RegExp[];
  }
}

export namespace NPlusOneQuery {
  export interface Options extends WarningLimit {
    errorLimit?: number;
  }
}

export namespace QueryFromInvalidPackage {
  export interface Options {
    parentPackages: string[];
    allowList?: RegExp[];
  }
}

export namespace QueryFromView {
  export interface Options {
    forbiddenLabel?: string;
  }
}

export namespace RPCWithoutCircuitBreaker {
  export interface Options {
    label?: string;
  }
}

export namespace SlowFunctionCall {
  export interface Options extends TimeAllowed {
    codeObjectName: string | RegExp;
  }
}

export namespace SlowHTTPServerRequest {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Options extends TimeAllowed {}
}

export namespace SlowQuery {
  export interface Options extends TimeAllowed {
    includeList: RegExp[];
    excludeList: RegExp[];
  }
}

export namespace TooManyJoins {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Options extends WarningLimit {}
}

export namespace TooManyUpdates {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Options extends WarningLimit {}
}
