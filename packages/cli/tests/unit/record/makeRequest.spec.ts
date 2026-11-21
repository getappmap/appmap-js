import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'http';
import type { AddressInfo } from 'net';
import makeRequest, { RemoteRecordingError } from '../../../src/cmds/record/makeRequest';
import RemoteRecording from '../../../src/cmds/record/remoteRecording';

describe('makeRequest', () => {
  let server: Server;
  let port: number;
  let handler: (req: IncomingMessage, res: ServerResponse) => void;

  beforeAll(async () => {
    server = createServer((req, res) => handler(req, res));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    ({ port } = server.address() as AddressInfo);
  });

  afterAll(() => new Promise((resolve) => server.close(resolve)));

  const remoteRecording = (hostname = '127.0.0.1', recordingPort = port) =>
    new RemoteRecording({ protocol: 'http:', hostname, port: recordingPort, path: '/' });

  it('resolves with the status and body when the status code matches', async () => {
    let request: { method?: string; url?: string } = {};
    handler = (req, res) => {
      request = { method: req.method, url: req.url };
      res.writeHead(201).end('{"events":["ü"]}');
    };

    await expect(
      makeRequest(remoteRecording(), '/_appmap/record', 'POST', 'testing', [201])
    ).resolves.toEqual({ statusCode: 201, data: '{"events":["ü"]}' });
    expect(request).toEqual({ method: 'POST', url: '/_appmap/record' });
  });

  it("rejects when the status code doesn't match", async () => {
    handler = (_req, res) => res.writeHead(500).end('it broke');

    const result = makeRequest(remoteRecording(), '/_appmap/record', 'DELETE', 'testing', [200]);
    await expect(result).rejects.toThrow(RemoteRecordingError);
    await expect(result).rejects.toMatchObject({
      description: 'testing',
      statusCode: 500,
      method: 'DELETE',
      path: '/_appmap/record',
      message: 'it broke',
    });
  });

  describe('on a network failure', () => {
    let closedPort: number;
    beforeEach(async () => {
      // Grab a free port, then close it so nothing is listening there.
      const closed = createServer();
      await new Promise<void>((resolve) => closed.listen(0, '127.0.0.1', resolve));
      ({ port: closedPort } = closed.address() as AddressInfo);
      await new Promise((resolve) => closed.close(resolve));
    });

    it('rejects with the underlying cause', async () => {
      await expect(
        makeRequest(remoteRecording('127.0.0.1', closedPort), '/', 'GET', 'testing')
      ).rejects.toThrow(`connect ECONNREFUSED 127.0.0.1:${closedPort}`);
    });

    it('spells out every address tried when all of them fail', async () => {
      // Connecting to "localhost" fails this way when it resolves to both ::1
      // and 127.0.0.1. Stubbed, since what localhost resolves to depends on
      // the machine.
      const errors = [
        new Error('connect ECONNREFUSED ::1:3000'),
        new Error('connect ECONNREFUSED 127.0.0.1:3000'),
      ];
      const fetchMock = jest
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new TypeError('fetch failed', { cause: new AggregateError(errors) }));
      try {
        await expect(makeRequest(remoteRecording(), '/', 'GET', 'testing')).rejects.toThrow(
          new AggregateError(
            errors,
            'connect ECONNREFUSED ::1:3000; connect ECONNREFUSED 127.0.0.1:3000'
          )
        );
      } finally {
        fetchMock.mockRestore();
      }
    });
  });
});
