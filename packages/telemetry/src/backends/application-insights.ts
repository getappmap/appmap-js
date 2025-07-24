import {
  ApplicationInsightsBackendConfiguration,
  FlushCallback,
  TelemetryBackend,
  TelemetryData,
} from '../types';
import { TelemetryClient as Client, setup as AppInsights } from 'applicationinsights';

// This key is meant to be publically shared. However, I'm adding a simple
// obfuscation to mitigate key scraping bots on GitHub. The key is split on
// hypens and base64 encoded without padding.
// key.split('-').map((x) => x.toString('base64').replace(/=*/, ''))
const INSTRUMENTATION_KEY = ['NTBjMWE1YzI', 'NDliNA', 'NDkxMw', 'YjdjYw', 'ODZhNzhkNDA3NDVm']
  .map((x) => Buffer.from(x, 'base64').toString('utf8'))
  .join('-');

export class ApplicationInsightsBackend implements TelemetryBackend {
  private readonly client: Client;

  constructor(
    userId: string,
    sessionId: string,
    productName: string,
    private readonly config: ApplicationInsightsBackendConfiguration
  ) {
    process.env.APPLICATION_INSIGHTS_NO_STATSBEAT = '1';

    const instrumentationKey = this.config.instrumentationKey || INSTRUMENTATION_KEY;
    // Disable everything we can, we don't any additional collection from Application Insights.
    AppInsights(instrumentationKey)
      .setAutoCollectRequests(false)
      .setAutoCollectPerformance(false)
      .setAutoCollectExceptions(false)
      .setAutoCollectDependencies(false)
      .setAutoCollectHeartbeat(false)
      .setAutoDependencyCorrelation(false)
      .setAutoCollectConsole(false)
      .setInternalLogging(false, false)
      .setSendLiveMetrics(false)
      .setUseDiskRetryCaching(true);

    const client = new Client(instrumentationKey);
    client.context.tags[client.context.keys.userId] = userId;
    client.context.tags[client.context.keys.sessionId] = sessionId;
    client.context.tags[client.context.keys.cloudRole] = productName;
    client.setAutoPopulateAzureProperties(false);

    this.client = client;
  }

  sendEvent(event: TelemetryData): void {
    this.client.trackEvent(event);
    this.client.flush();
  }

  flush(callback?: FlushCallback): void {
    this.client.flush();
    callback?.();
  }
}
