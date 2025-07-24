export interface TelemetryData {
  name: string;
  properties?: Record<string, string | undefined>;
  metrics?: Record<string, number | undefined>;
}

export interface TelemetryOptions {
  includeEnvironment: boolean;
}

export type FlushCallback = () => void;

export interface ITelemetryClient {
  enabled: boolean;
  machineId: Readonly<string>;
  sessionId: Readonly<string>;
  configure(config: Partial<TelemetryConfiguration>): void;
  sendEvent(data: TelemetryData, options?: TelemetryOptions): void;
  flush(callback?: FlushCallback): void;
}

export interface TelemetryBackend {
  sendEvent(event: TelemetryData): void;
  flush(callback?: FlushCallback): void;
}

export type BaseBackendConfiguration = {
  type: string;
};

export type ProductConfiguration = {
  name: string;
  version: string;
};

export interface TelemetryConfiguration {
  product: ProductConfiguration;
  propPrefix: string;
  backend: BackendConfiguration;
}

export interface ApplicationInsightsBackendConfiguration extends BaseBackendConfiguration {
  type: 'application-insights';
  instrumentationKey?: string;
}

export interface CustomBackendConfiguration extends BaseBackendConfiguration, TelemetryBackend {
  type: 'custom';
  sendEvent: (event: TelemetryData) => void;
  flush: (callback?: FlushCallback) => void;
}

// Add additional backend configurations here as needed.
export type BackendConfiguration =
  | CustomBackendConfiguration
  | ApplicationInsightsBackendConfiguration;
