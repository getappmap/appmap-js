import { Logger, type Config } from 'splunk-logging';

import type {
  SplunkBackendConfiguration,
  TelemetryBackend,
  TelemetryData,
  FlushCallback,
} from '../types';

export class SplunkBackend implements TelemetryBackend {
  private readonly logger: Logger;

  constructor(config: Partial<SplunkBackendConfiguration> = {}) {
    const fullConfig = makeConfig(config);
    this.logger = new Logger(fullConfig);
    config.url = fullConfig.url; // expose url for debugging
  }

  sendEvent(event: TelemetryData): void {
    this.logger.send({ message: event });
  }

  flush(callback?: FlushCallback): void {
    if (
      this.logger.serializedContextQueue &&
      (this.logger.serializedContextQueue.length || 0) > 0
    ) {
      // this errors if there is nothing to flush
      this.logger.flush(callback);
    } else {
      if (callback) callback();
    }
  }
}

function makeConfig(config: Partial<SplunkBackendConfiguration>): Config {
  return {
    token:
      config.token ??
      process.env.SPLUNK_TOKEN ??
      (() => {
        throw new Error('SPLUNK_TOKEN is required');
      })(),
    url:
      config.url ??
      process.env.SPLUNK_URL ??
      (() => {
        throw new Error('SPLUNK_URL is required');
      })(),
    ...config,
  };
}
