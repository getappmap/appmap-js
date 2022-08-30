import { AxiosAdapter } from 'axios';
import makeRequest, {
  RemoteRecordingError,
} from '../../../src/cmds/record/makeRequest';
import RemoteRecording from '../../../src/cmds/record/remoteRecording';

describe('makeRequest', () => {
  let rr: RemoteRecording;
  beforeEach(() => {
    rr = new RemoteRecording({});
  });

  it('resolves when the status code matches', async () => {
    const expected = {
      data: 'data',
      statusCode: 200,
    };

    const adapter: AxiosAdapter = async (config) => {
      return new Promise((resolve) => {
        resolve({
          status: expected.statusCode,
          data: expected.data,
          headers: {},
          statusText: '',
          config,
        });
      });
    };
    await expect(
      makeRequest(rr, '/', 'GET', 'testing', [200], adapter)
    ).resolves.toEqual(expected);
  });

  it("rejects when the status code doesn't match", async () => {
    const adapter: AxiosAdapter = async (config) => {
      return new Promise((resolve) => {
        resolve({
          status: 500,
          data: '',
          statusText: 'Server Error',
          headers: {},
          config,
        });
      });
    };
    await expect(
      makeRequest(rr, '/', 'GET', 'testing', [200], adapter)
    ).rejects.toThrow(RemoteRecordingError);
  });
});
