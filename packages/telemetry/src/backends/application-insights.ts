import type { ClientRequest } from 'node:http';
import * as https from 'node:https';
import os from 'node:os';

import type {
  ApplicationInsightsBackendConfiguration,
  FlushCallback,
  TelemetryBackend,
  TelemetryData,
} from '../types';

const MaxFlushTime = 5000; // 5 seconds

// This key is meant to be publically shared. However, I'm adding a simple
// obfuscation to mitigate key scraping bots on GitHub. The key is split on
// hypens and base64 encoded without padding.
// key.split('-').map((x) => x.toString('base64').replace(/=*/, ''))
const INSTRUMENTATION_KEY = ['NTBjMWE1YzI', 'NDliNA', 'NDkxMw', 'YjdjYw', 'ODZhNzhkNDA3NDVm']
  .map((x) => Buffer.from(x, 'base64').toString('utf8'))
  .join('-');

const AI_ENDPOINT = 'dc.services.visualstudio.com';
const AI_PATH = '/v2/track';

export class ApplicationInsightsBackend implements TelemetryBackend {
  private readonly instrumentationKey: string;
  private readonly userId: string;
  private readonly sessionId: string;
  private readonly productName: string;
  private readonly hostname: string;
  private readonly uname: string;
  private pendingRequests = new Set<ClientRequest>();

  constructor(
    userId: string,
    sessionId: string,
    productName: string,
    private readonly config: ApplicationInsightsBackendConfiguration
  ) {
    this.instrumentationKey = this.config.instrumentationKey || INSTRUMENTATION_KEY;
    this.userId = userId;
    this.sessionId = sessionId;
    this.productName = productName;
    this.hostname = os.hostname();
    this.uname = os.type() + ' ' + os.release();
  }

  sendEvent(event: TelemetryData): void {
    const envelope = {
      name: 'Microsoft.ApplicationInsights.Event',
      time: new Date().toISOString(),
      iKey: this.instrumentationKey,
      tags: {
        'ai.user.id': this.userId,
        'ai.session.id': this.sessionId,
        'ai.cloud.role': this.productName,
        'ai.cloud.roleInstance': this.hostname,
        'ai.device.osVersion': this.uname
      },
      data: {
        baseType: 'EventData',
        baseData: event,
      },
    };
    this._post([envelope]);
  }

  // Resolve once all in-flight requests have settled (their response/error
  // handlers, including any warning, have run), so callers — and tests — can
  // await the full request lifecycle rather than just the request being sent.
  flush(callback?: FlushCallback): void {
    const startTime = process.hrtime.bigint();

    const checkPending = () => {
      if (this.pendingRequests.size === 0) {
        callback?.();
        return;
      }

      const elapsedMs = Number((process.hrtime.bigint() - startTime) / BigInt(1_000_000));
      if (elapsedMs > MaxFlushTime) {
        console.warn(`ApplicationInsightsBackend: Flush timed out after ${MaxFlushTime}ms`);
        this.pendingRequests.forEach((req) => req.destroy());
        callback?.();
        return;
      }

      setTimeout(checkPending, 10);
    };

    checkPending();
  }

  private _post(envelopes: unknown[]): void {
    const body = JSON.stringify(envelopes);
    const options = {
      hostname: AI_ENDPOINT,
      path: AI_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      // drain response to avoid memory leak
      res
        .on('data', () => { })
        .on('end', () => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            console.warn(`ApplicationInsightsBackend: Failed to send telemetry event. Status: ${res.statusCode}`);
          }
          this.pendingRequests.delete(req);
        });
    });
    this.pendingRequests.add(req);
    req.on('error', (e) => {
      console.warn('Error sending telemetry data to Application Insights', e);
      this.pendingRequests.delete(req);
    });
    req.write(body);
    req.end();
  }
}
