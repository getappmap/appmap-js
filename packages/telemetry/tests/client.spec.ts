
import Conf from 'conf';
import { name as appName, version } from '../package.json';
import { Contracts } from 'applicationinsights';
import assert from 'node:assert';
import { TelemetryClient } from '../src';
import { createMockServer } from './helpers/mockServer';

describe('TelemetryClient', () => {
  beforeEach(() => {
    // Don't persist data locally
    jest.spyOn(Conf.prototype, 'set').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Telemetry', () => {
    let sendEvent: jest.MockedFunction<(data: Contracts.EventTelemetry) => void>;
    let flush: jest.MockedFunction<() => void>;
    let client: TelemetryClient;
    const sessionId = 'the-session-id';

    beforeEach(() => {
      sendEvent = jest.fn();
      flush = jest.fn();
      jest.spyOn(Conf.prototype, 'get').mockImplementation((key: string) => {
        if (key === 'sessionId') return sessionId;
        if (key === 'sessionExpiration') return Date.now() + 120_000;
        return undefined;
      });
      client = new TelemetryClient({ backend: { type: 'custom', sendEvent, flush } });
      client.enabled = true;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('sends the expected telemetry data', () => {
      client.sendEvent({
        name: 'test',
        properties: { prop: 'value' },
        metrics: { metric: 1 },
      });

      const [[{ name, properties, measurements }]] = sendEvent.mock.calls;
      assert(name);
      assert(properties);
      assert(measurements);

      expect(sendEvent).toHaveBeenCalled();
      expect(name).toBe(`${appName}/test`);
      expect(properties['common.source']).toBe(appName);
      expect(properties['common.os']).not.toHaveLength(0);
      expect(properties['common.platformversion']).not.toHaveLength(0);
      expect(properties['common.arch']).not.toHaveLength(0);
      expect(properties).not.toHaveProperty('common.environmentVariables');
      expect(properties['appland.telemetry.version']).toBe(version);
      expect(properties['appmap.cli.machineId']).toBe(client.machineId);
      expect(properties['appmap.cli.sessionId']).toBe(client.sessionId);
      expect(typeof properties['appland.telemetry.args']).toBe('string');
      expect(properties['appland.telemetry.prop']).toBe('value');
      expect(measurements['appland.telemetry.metric']).toBe(1);
    });

    it('does not send undefined properties', () => {
      client.sendEvent({
        name: 'test',
        properties: { prop: undefined },
        metrics: { metric: undefined },
      });

      const [[{ properties }]] = sendEvent.mock.calls;
      assert(properties);

      expect(properties).not.toHaveProperty('appmap.cli.prop');
      expect(properties).not.toHaveProperty('appmap.cli.metric');
    });

    it('does not transform qualified keys', () => {
      client.sendEvent({
        name: 'test event',
        properties: {
          'qualified.test.property': 'test value',
        },
      });
      const [[{ properties }]] = sendEvent.mock.calls;
      assert(properties);
      expect(properties['qualified.test.property']).toEqual('test value');
    });

    it('sends env var names upon request', () => {
      client.sendEvent(
        {
          name: 'test',
        },
        { includeEnvironment: true }
      );

      const [[{ properties }]] = sendEvent.mock.calls;
      assert(properties);

      const envVars: string = properties['common.environmentVariables'];
      expect(envVars.split(',')).toBeInstanceOf(Array);
      expect(envVars).toMatch(/\bNODE_ENV\b/);
    });

    it('cannot be configured twice', () => {
      // It's already been configured once in the constructor
      expect(() => {
        client.configure({ product: { name: 'test', version: '1.0.0' } });
      }).toThrow('Telemetry client is already configured');
    });
  });

  describe('Backend Configuration', () => {
    const mockServer = createMockServer();

    beforeEach((done) => {
      mockServer.clear();
      mockServer.start(done);
    });

    afterEach((done) => {
      mockServer.stop(done);
      delete process.env.APPMAP_TELEMETRY_BACKEND;
      delete process.env.SPLUNK_TOKEN;
      delete process.env.SPLUNK_URL;
    });

    it('configures SplunkBackend from environment variables', (done) => {
      const port = mockServer.getServerPort();
      process.env.APPMAP_TELEMETRY_BACKEND = 'splunk';
      process.env.SPLUNK_TOKEN = 'client-env-token';
      process.env.SPLUNK_URL = `http://127.0.0.1:${port}`;

      const client = new TelemetryClient();
      client.enabled = true;
      client.sendEvent({ name: 'clientEnvTest' });

      client.flush(() => {
        expect(mockServer.receivedRequests).toHaveLength(1);
        const [request] = mockServer.receivedRequests;
        expect(request.headers.authorization).toBe('Splunk client-env-token');
        done();
      });
    });
  });
});
