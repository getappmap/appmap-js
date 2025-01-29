/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import NopNavie from '../../../../src/rpc/explain/navie/navie-nop';

describe('NopNavie', () => {
  let navie: NopNavie;

  beforeEach(() => {
    navie = new NopNavie();
  });

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
