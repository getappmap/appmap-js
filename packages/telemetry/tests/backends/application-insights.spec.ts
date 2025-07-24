import { TelemetryClient, setup } from 'applicationinsights';
import { ApplicationInsightsBackend } from '../../src/backends/application-insights';
import { TelemetryData } from '../../src';

jest.mock('applicationinsights', () => {
  const mockClient = {
    trackEvent: jest.fn(),
    flush: jest.fn(),
    context: {
      tags: {},
      keys: {},
    },
    setAutoPopulateAzureProperties: jest.fn(),
  };
  return {
    TelemetryClient: jest.fn(() => mockClient),
    setup: jest.fn().mockReturnValue({
      setAutoCollectRequests: jest.fn().mockReturnThis(),
      setAutoCollectPerformance: jest.fn().mockReturnThis(),
      setAutoCollectExceptions: jest.fn().mockReturnThis(),
      setAutoCollectDependencies: jest.fn().mockReturnThis(),
      setAutoCollectHeartbeat: jest.fn().mockReturnThis(),
      setAutoDependencyCorrelation: jest.fn().mockReturnThis(),
      setAutoCollectConsole: jest.fn().mockReturnThis(),
      setInternalLogging: jest.fn().mockReturnThis(),
      setSendLiveMetrics: jest.fn().mockReturnThis(),
      setUseDiskRetryCaching: jest.fn().mockReturnThis(),
    }),
  };
});

interface ApplicationInsightsBackendPrivate {
  client: TelemetryClient;
  flush: jest.Mock;
  sendEvent: jest.Mock;
}

describe('ApplicationInsightsBackend', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default configuration', () => {
    const backend = new ApplicationInsightsBackend('user-id', 'session-id', 'product-name', {
      type: 'application-insights',
    }) as unknown as ApplicationInsightsBackendPrivate;
    expect(backend.client).toBeDefined();

    const [[instrumentationKey]] = (setup as jest.Mock).mock.calls;
    expect(instrumentationKey).toMatch(/^[a-z0-9-]+$/);
  });

  it('uses provided instrumentation key', () => {
    const mockInstrumentationKey = 'test-instrumentation-key';
    const backend = new ApplicationInsightsBackend('user-id', 'session-id', 'product-name', {
      type: 'application-insights',
      instrumentationKey: mockInstrumentationKey,
    }) as unknown as ApplicationInsightsBackendPrivate;
    expect(backend.client).toBeDefined();

    const [[instrumentationKey]] = (setup as jest.Mock).mock.calls;
    expect(instrumentationKey).toStrictEqual(mockInstrumentationKey);
  });

  it('sends events correctly', () => {
    const backend = new ApplicationInsightsBackend('user-id', 'session-id', 'product-name', {
      type: 'application-insights',
    }) as unknown as ApplicationInsightsBackendPrivate;

    const event: TelemetryData = {
      name: 'test-event',
      properties: { key: 'value' },
      metrics: { metric1: 100 },
    };

    backend.sendEvent(event);
    expect(backend.client.trackEvent).toHaveBeenCalledWith(event);
    expect(backend.client.flush).toHaveBeenCalled();
  });
});
