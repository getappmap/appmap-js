import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { SplunkBackend } from '../../src/backends/splunk';
import { TelemetryData } from '../../src/types';

import { createMockServer } from '../helpers/mockServer';

describe('SplunkBackend', () => {
  const mockServer = createMockServer();
  let port: number;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach((done) => {
    mockServer.clear();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockServer.start(() => {
      port = mockServer.getServerPort();
      done();
    });
  });

  afterEach((done) => {
    mockServer.stop(done);
    consoleWarnSpy.mockRestore();
    delete process.env.SPLUNK_TOKEN;
    delete process.env.SPLUNK_URL;
  });

  it('sends an event to Splunk', (done) => {
    const splunk = new SplunkBackend({
      token: 'test-token',
      url: `http://127.0.0.1:${port}`,
    });

    const event: TelemetryData = { name: 'testEvent', properties: { foo: 'bar' } };
    splunk.sendEvent(event);

    splunk.flush(() => {
      expect(mockServer.receivedRequests).toHaveLength(1);
      const [request] = mockServer.receivedRequests;
      expect(request.url).toBe('/services/collector/event');
      expect(request.headers.authorization).toBe('Splunk test-token');
      expect(JSON.parse(request.body)).toEqual({ event });
      done();
    });
  });

  it('configures from environment variables', (done) => {
    process.env.SPLUNK_TOKEN = 'env-token';
    process.env.SPLUNK_URL = `http://127.0.0.1:${port}`;

    const splunk = new SplunkBackend();
    const event: TelemetryData = { name: 'envTestEvent' };
    splunk.sendEvent(event);

    splunk.flush(() => {
      expect(mockServer.receivedRequests).toHaveLength(1);
      const [request] = mockServer.receivedRequests;
      expect(request.headers.authorization).toBe('Splunk env-token');
      done();
    });
  });

  it('uses a custom path if provided', (done) => {
    const splunk = new SplunkBackend({
      token: 'test-token',
      url: `http://127.0.0.1:${port}/my/custom/path`,
    });

    splunk.sendEvent({ name: 'customPathEvent', properties: { foo: 'bar' } });

    splunk.flush(() => {
      expect(mockServer.receivedRequests).toHaveLength(1);
      const [request] = mockServer.receivedRequests;
      expect(request.url).toBe('/my/custom/path');
      done();
    });
  });

  it('flushes multiple events', (done) => {
    const splunk = new SplunkBackend({
      token: 'test-token',
      url: `http://127.0.0.1:${port}`,
    });

    const event1: TelemetryData = { name: 'event1', metrics: { value: 1 } };
    const event2: TelemetryData = { name: 'event2', metrics: { value: 2 } };

    splunk.sendEvent(event1);
    splunk.sendEvent(event2);

    splunk.flush(() => {
      expect(mockServer.receivedRequests).toHaveLength(2);
      expect(JSON.parse(mockServer.receivedRequests[0].body)).toEqual({ event: event1 });
      expect(JSON.parse(mockServer.receivedRequests[1].body)).toEqual({ event: event2 });
      done();
    });
  });

  it('logs a warning for non-2xx HTTP responses', (done) => {
    mockServer.requestHandler.mockImplementation((req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Internal Server Error' }));
    });

    const splunk = new SplunkBackend({
      token: 'test-token',
      url: `http://127.0.0.1:${port}`,
    });

    const event: TelemetryData = { name: 'errorEvent', properties: { code: '500' } };
    splunk.sendEvent(event);

    splunk.flush(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'SplunkBackend: Failed to send telemetry event. Status: 500, Response: {"message":"Internal Server Error"}'
      );
      done();
    });
  });

  it('logs a warning for connectivity errors', (done) => {
    mockServer.requestHandler.mockImplementation((req) => {
      req.destroy(); // Simulate a connection error
    });

    const splunk = new SplunkBackend({
      token: 'test-token',
      url: `http://127.0.0.1:${port}`,
    });

    const event: TelemetryData = { name: 'connectivityErrorEvent' };
    splunk.sendEvent(event);

    setTimeout(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('SplunkBackend: Connectivity error sending telemetry event:'));
      done();
    }, 100);
  });

  it('times out if flush takes too long', (done) => {
    jest.useFakeTimers();
    mockServer.requestHandler.mockImplementation(() => {
      // Don't send a response, so the request never finishes
    });

    const splunk = new SplunkBackend({
      token: 'test-token',
      url: `http://127.0.0.1:${port}`,
    });

    const event: TelemetryData = { name: 'timeoutEvent' };
    splunk.sendEvent(event);

    const flushCallback = jest.fn();
    splunk.flush(flushCallback);

    jest.advanceTimersByTime(5100);

    expect(flushCallback).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('SplunkBackend: Flush timed out after 5000ms');
    jest.useRealTimers();
    done();
  });

  describe('SPLUNK_CA_CERT handling', () => {
    const caCert = '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----';
    const caPath = path.join(__dirname, 'test-ca.crt');

    beforeEach(() => {
      delete process.env.SPLUNK_CA_CERT;
    });

    afterAll(() => {
      if (fs.existsSync(caPath)) {
        fs.unlinkSync(caPath);
      }
    });

    it('uses rejectUnauthorized: false when SPLUNK_CA_CERT is not set for https', () => {
      const splunk = new SplunkBackend({
        token: 'test-token',
        url: `https://127.0.0.1:${port}`,
      });
      const agent = splunk['httpAgent'] as https.Agent;
      expect(agent.options.rejectUnauthorized).toBe(false);
    });

    it('uses system CA when SPLUNK_CA_CERT is "system"', () => {
      process.env.SPLUNK_CA_CERT = 'system';
      const splunk = new SplunkBackend({
        token: 'test-token',
        url: `https://127.0.0.1:${port}`,
      });
      const agent = splunk['httpAgent'] as https.Agent;
      expect(agent.options.rejectUnauthorized).toBe(true);
      expect(agent.options.ca).toBeUndefined();
    });

    it('loads CA from a file when SPLUNK_CA_CERT starts with @', () => {
      fs.writeFileSync(caPath, caCert);
      process.env.SPLUNK_CA_CERT = `@${caPath}`;
      const splunk = new SplunkBackend({
        token: 'test-token',
        url: `https://127.0.0.1:${port}`,
      });
      const agent = splunk['httpAgent'] as https.Agent;
      expect(agent.options.rejectUnauthorized).toBe(true);
      expect(agent.options.ca?.toString()).toBe(caCert);
    });

    it('uses CA from the environment variable value directly', () => {
      process.env.SPLUNK_CA_CERT = caCert;
      const splunk = new SplunkBackend({
        token: 'test-token',
        url: `https://127.0.0.1:${port}`,
      });
      const agent = splunk['httpAgent'] as https.Agent;
      expect(agent.options.rejectUnauthorized).toBe(true);
      expect(agent.options.ca).toBe(caCert);
    });
  });
});
