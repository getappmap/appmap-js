import nock from 'nock';

import type { TelemetryData } from '../../src';
import { ApplicationInsightsBackend } from '../../src/backends/application-insights';

const AI_ENDPOINT = 'https://dc.services.visualstudio.com';
const AI_PATH = '/v2/track';

interface Envelope {
  name: string;
  time: string;
  iKey: string;
  tags: Record<string, string>;
  data: {
    baseType: string;
    baseData: TelemetryData;
  };
}

describe('ApplicationInsightsBackend', () => {
  let requestBody: Envelope[];
  let scope: nock.Scope;

  beforeEach(() => {
    nock.disableNetConnect();
    scope = nock(AI_ENDPOINT)
      .post(AI_PATH, (body: Envelope[]) => {
        requestBody = body;
        return true;
      })
      .reply(200);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  const waitForRequest = async (scope: nock.Scope) => {
    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(() => {
        if (scope.isDone()) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('waitForRequest timed out'));
      }, 1000);
    });
  };

  it('initializes with default configuration', async () => {
    const backend = new ApplicationInsightsBackend('user-id', 'session-id', 'product-name', {
      type: 'application-insights',
    });

    const event: TelemetryData = {
      name: 'test-event',
      properties: { key: 'value' },
      metrics: { metric1: 100 },
    };

    backend.sendEvent(event);

    await waitForRequest(scope);

    const envelope = requestBody[0];
    expect(envelope.iKey).toMatch(/^[a-z0-9-]+$/);
  });

  it('uses provided instrumentation key', async () => {
    const mockInstrumentationKey = 'test-instrumentation-key';
    const backend = new ApplicationInsightsBackend('user-id', 'session-id', 'product-name', {
      type: 'application-insights',
      instrumentationKey: mockInstrumentationKey,
    });

    const event: TelemetryData = {
      name: 'test-event',
    };

    backend.sendEvent(event);

    await waitForRequest(scope);

    const envelope = requestBody[0];
    expect(envelope.iKey).toBe(mockInstrumentationKey);
  });

  it('sends events correctly', async () => {
    const backend = new ApplicationInsightsBackend('user-id', 'session-id', 'product-name', {
      type: 'application-insights',
    });

    const event: TelemetryData = {
      name: 'test-event',
      properties: { key: 'value' },
      metrics: { metric1: 100 },
    };

    backend.sendEvent(event);

    await waitForRequest(scope);

    const envelope = requestBody[0];
    expect(envelope.name).toBe('Microsoft.ApplicationInsights.Event');
    expect(envelope.data.baseType).toBe('EventData');
    expect(envelope.data.baseData).toEqual(event);
    expect(envelope.tags).toMatchObject({
      'ai.user.id': 'user-id',
      'ai.session.id': 'session-id',
      'ai.cloud.role': 'product-name',
    });
  });

  it('handles https errors', async () => {
    nock.cleanAll(); // Don't use the default scope
    const errorScope = nock(AI_ENDPOINT).post(AI_PATH).replyWithError('test error');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const backend = new ApplicationInsightsBackend('user-id', 'session-id', 'product-name', {
      type: 'application-insights',
    });

    const event: TelemetryData = {
      name: 'test-event',
    };

    backend.sendEvent(event);

    await waitForRequest(errorScope);

    expect(warnSpy).toHaveBeenCalledWith(
      'Error sending telemetry data to Application Insights',
      expect.any(Error)
    );
  });

  it('logs a warning for non-2xx HTTP responses', async () => {
    nock.cleanAll();
    const errorScope = nock(AI_ENDPOINT).post(AI_PATH).reply(500, { message: 'Internal Server Error' });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const backend = new ApplicationInsightsBackend('user-id', 'session-id', 'product-name', {
      type: 'application-insights',
    });

    const event: TelemetryData = {
      name: 'test-event',
    };

    backend.sendEvent(event);

    await waitForRequest(errorScope);

    expect(warnSpy).toHaveBeenCalledWith(
      'ApplicationInsightsBackend: Failed to send telemetry event. Status: 500'
    );
  });
});
