/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import RemoteNavie from '../../../../src/rpc/explain/navie/navie-remote';
import { verbose } from '../../../../src/utils';

jest.mock('@appland/client');

if (process.env.VERBOSE === 'true') verbose(true);

describe('RemoteNavie', () => {
  let navie: RemoteNavie;

  beforeEach(() => {
    navie = new RemoteNavie();
  });

  afterEach(() => jest.clearAllMocks());

  it('is disabled', async () => {
    const onError = jest.fn();
    navie.on('error', onError);
    await navie.ask('threadId', 'question');
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('the free hosted service is offline'),
      })
    );
  });
});
