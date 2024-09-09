import { EventEmitter } from 'events';
import LocalNavie from '../../../../../src/rpc/explain/navie/navie-local';

const tokens: string[] = Array.from({ length: 1024 }, () =>
  String.fromCharCode(Math.random() * 26 + 97)
);
jest.mock('@appland/navie', () => {
  /* eslint-disable
    @typescript-eslint/no-unsafe-assignment,
    @typescript-eslint/no-unsafe-return,
    @typescript-eslint/no-unsafe-member-access,
    @typescript-eslint/no-explicit-any
  */
  const original = jest.requireActual('@appland/navie');
  return {
    ...original,
    navie: jest.fn().mockImplementation(() => {
      const result: any = new EventEmitter();
      result.execute = function* execute() {
        for (const token of tokens) {
          yield token;
        }
      };
      return result;
    }),
  };
  /* eslint-enable
    @typescript-eslint/no-unsafe-assignment,
    @typescript-eslint/no-unsafe-return,
    @typescript-eslint/no-unsafe-member-access,
    @typescript-eslint/no-explicit-any
  */
});

describe('LocalNavie', () => {
  describe('token emission', () => {
    afterEach(() => jest.resetAllMocks());

    it('emits tokens in the correct order', async () => {
      const navie = new LocalNavie(jest.fn(), jest.fn(), jest.fn());
      let completion = '';
      navie.on('token', (t) => (completion += t));
      await navie.ask(undefined, 'question');
      expect(completion).toEqual(tokens.join(''));
    });
  });
});
