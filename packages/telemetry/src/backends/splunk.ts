import * as http from 'node:http';
import * as https from 'node:https';
import { URL } from 'node:url';
import * as fs from 'node:fs';

import type {
  SplunkBackendConfiguration,
  TelemetryBackend,
  TelemetryData,
  FlushCallback,
} from '../types';

const DefaultSplunkPath = '/services/collector/event';
const MaxFlushTime = 5000; // 5 seconds

export class SplunkBackend implements TelemetryBackend {
  private readonly config: Required<SplunkBackendConfiguration>;
  private readonly httpAgent: http.Agent | https.Agent;
  private pendingRequests = 0;

  constructor(config: Partial<SplunkBackendConfiguration> = {}) {
    const token = config.token ?? process.env.SPLUNK_TOKEN;
    const url = config.url ?? process.env.SPLUNK_URL;

    if (!token) {
      throw new Error('SPLUNK_TOKEN is required');
    }
    if (!url) {
      throw new Error('SPLUNK_URL is required');
    }

    this.config = {
      type: 'splunk',
      token: token,
      url: url,
    };

    const parsedUrl = new URL(this.config.url);
    const isHttps = parsedUrl.protocol === 'https:';

    if (isHttps) {
      const splunkCaCert = process.env.SPLUNK_CA_CERT;
      let httpsAgentOptions: https.AgentOptions = {
        rejectUnauthorized: false, // Self-signed certs are common in Splunk
      };

      if (splunkCaCert) {
        if (splunkCaCert === 'system') {
          httpsAgentOptions = {
            rejectUnauthorized: true,
          };
        } else if (splunkCaCert.startsWith('@')) {
          const caPath = splunkCaCert.substring(1);
          httpsAgentOptions = {
            rejectUnauthorized: true,
            ca: fs.readFileSync(caPath),
          };
        } else {
          httpsAgentOptions = {
            rejectUnauthorized: true,
            ca: splunkCaCert,
          };
        }
      }
      this.httpAgent = new https.Agent(httpsAgentOptions);
    } else {
      this.httpAgent = new http.Agent();
    }
  }

  sendEvent(event: TelemetryData): void {
    this.pendingRequests++;
    const parsedUrl = new URL(this.config.url);
    const path = parsedUrl.pathname === '/' ? DefaultSplunkPath : parsedUrl.pathname;

    const payload = JSON.stringify({ event });

    const options: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : (parsedUrl.protocol === 'https:' ? 443 : 8088),
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Splunk ${this.config.token}`,
      },
      agent: this.httpAgent,
    };

    const req = (parsedUrl.protocol === 'https:' ? https : http).request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        this.pendingRequests--;
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          console.warn(
            `SplunkBackend: Failed to send telemetry event. Status: ${res.statusCode}, Response: ${responseBody}`
          );
        }
      });
    });

    req.on('error', (e) => {
      this.pendingRequests--;
      console.warn(`SplunkBackend: Connectivity error sending telemetry event: ${e.message}`);
    });

    req.write(payload);
    req.end();
  }

  flush(callback?: FlushCallback): void {
    const startTime = process.hrtime.bigint();

    const checkPending = () => {
      if (this.pendingRequests === 0) {
        if (callback) {
          callback();
        }
        return;
      }

      const elapsedNs = process.hrtime.bigint() - startTime;
      const elapsedMs = Number(elapsedNs / BigInt(1000000));

      if (elapsedMs > MaxFlushTime) {
        console.warn(`SplunkBackend: Flush timed out after ${MaxFlushTime}ms`);
        if (callback) {
          callback();
        }
        return;
      }

      setTimeout(checkPending, 10); // Check again in 10ms
    };

    checkPending();
  }
}
