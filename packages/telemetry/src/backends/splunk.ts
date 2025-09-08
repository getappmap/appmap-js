import { Logger } from 'splunk-logging';
import { SplunkBackendConfiguration, TelemetryBackend, TelemetryData } from '../types';

export class SplunkBackend implements TelemetryBackend {
  private readonly logger: Logger;

  constructor(config: SplunkBackendConfiguration) {
    this.logger = new Logger(config);
  }

  sendEvent(event: TelemetryData): void {
    this.logger.send({ message: event });
  }

  flush(): void {
    this.logger.flush();
  }
}
