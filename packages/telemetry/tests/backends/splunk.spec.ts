/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from 'splunk-logging';

import { TelemetryClient } from '../../src';
import { SplunkBackend } from '../../src/backends/splunk';
import type { TelemetryData } from '../../src/types';

const TOKEN = 'test-token';
const URL = 'https://splunk.example.com';

describe('splunk backend', () => {
  let backend: SplunkBackend;
  let send: Logger['send'];
  let flush: Logger['flush'];

  beforeEach(() => {
    backend = new SplunkBackend({ type: 'splunk', token: TOKEN, url: URL });
    const logger = jest.mocked(Logger).mock.results[0].value as jest.Mocked<Logger>;
    send = logger.send;
    flush = logger.flush;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends event data to splunk logger', () => {
    const event: TelemetryData = {
      name: 'test-event',
      properties: { prop: 'value' },
      metrics: { metric: 1 },
    };
    backend.sendEvent(event);
    expect(send).toHaveBeenCalledWith({ message: event });
  });

  it("can be configured with environment variables", () => {
    process.env.SPLUNK_TOKEN = TOKEN;
    process.env.SPLUNK_URL = URL;
    new SplunkBackend();
    expect(jest.mocked(Logger)).toHaveBeenCalledWith({ token: TOKEN, url: URL });
    // Clean up environment variables
    delete process.env.SPLUNK_TOKEN;
    delete process.env.SPLUNK_URL;
  });
});

describe('splunk backend as default', () => {
  it("will be used by default if correct backend environment variables are set", () => {
    const env = process.env;
    process.env.SPLUNK_TOKEN = TOKEN;
    process.env.SPLUNK_URL = URL;
    process.env.APPMAP_TELEMETRY_BACKEND = 'splunk';
    delete process.env.APPMAP_TELEMETRY_DISABLED;

    const client = new TelemetryClient();
    
    // send an event
    const event: TelemetryData = { name: 'test-event' };
    client.sendEvent(event);
    
    expect(jest.mocked(Logger)).toHaveBeenCalledWith(expect.objectContaining({ token: TOKEN, url: URL }));
    const logger = jest.mocked(Logger).mock.results[0].value as jest.Mocked<Logger>;
    const send = logger.send;
    expect(send).toHaveBeenCalledWith({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      message: expect.objectContaining({ name: expect.stringContaining('test-event') }),
    });
    // Clean up environment variables
    process.env = env;
  });
});

jest.mock('splunk-logging', () => {
  const send = jest.fn();
  const flush = jest.fn();
  const Logger = jest.fn(() => ({
    send,
    flush,
  }));
  return { Logger };
});
