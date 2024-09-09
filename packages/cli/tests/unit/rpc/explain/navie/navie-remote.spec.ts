import RemoteNavie from '../../../../../src/rpc/explain/navie/navie-remote';

const tokens: string[] = Array.from({ length: 1024 }, () =>
  String.fromCharCode(Math.random() * 26 + 97)
);
jest.mock('@appland/client', () => {
  /* eslint-disable
    @typescript-eslint/no-unsafe-assignment,
    @typescript-eslint/no-unsafe-return,
    @typescript-eslint/no-unsafe-member-access,
    @typescript-eslint/no-explicit-any
  */
  const original = jest.requireActual('@appland/client');
  return {
    ...original,
    AI: {
      connect: jest.fn().mockImplementation((callbacksObj: any) => {
        return {
          inputPrompt: jest.fn().mockImplementation(async () => {
            await callbacksObj.onAck('userMessageId', 'threadId');
            for (const token of tokens) {
              await callbacksObj.onToken(token, 'messageId');
            }
            await callbacksObj.onComplete();
          }),
        };
      }),
    },
  };
  /* eslint-enable
    @typescript-eslint/no-unsafe-assignment,
    @typescript-eslint/no-unsafe-return,
    @typescript-eslint/no-unsafe-member-access,
    @typescript-eslint/no-explicit-any
  */
});

describe('RemoteNavie', () => {
  describe('token emission', () => {
    afterEach(() => jest.resetAllMocks());

    it('emits tokens in the correct order', async () => {
      const navie = new RemoteNavie(jest.fn(), jest.fn(), jest.fn());
      let completion = '';
      navie.on('token', (t) => (completion += t));
      await new Promise((resolve) => {
        navie.on('complete', resolve);
        return navie.ask('threadId', 'question');
      });
      expect(completion).toEqual(tokens.join(''));
    });
  });
});
