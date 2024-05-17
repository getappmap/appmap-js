import EventEmitter from 'events';
import { navie as navieFn, Navie } from '@appland/navie';

import LocalNavie from '../../../../src/rpc/explain/navie/navie-local';

jest.mock('@appland/navie');

describe('LocalNavie', () => {
  let navie: LocalNavie;
  let contextProvider = jest.fn();
  let projectInfoProvider = jest.fn();
  let helpProvider = jest.fn();

  beforeEach(() => (navie = new LocalNavie(contextProvider, projectInfoProvider, helpProvider)));

  describe('setOptions', () => {
    it("should set 'temperature'", () => {
      navie.setOption('temperature', 0.5);
      expect(navie.navieOptions.temperature).toBe(0.5);
    });
    it("should set 'modelName'", () => {
      navie.setOption('modelName', 'model');
      expect(navie.navieOptions.modelName).toBe('model');
    });
    it("should set 'tokenLimit'", () => {
      navie.setOption('tokenLimit', 100);
      expect(navie.navieOptions.tokenLimit).toBe(100);
    });
    it("should ignore 'explainMode'", () => {
      navie.setOption('explainMode', 'mode');
    });
    it('should throw an error for unsupported option', () => {
      expect(() => navie.setOption('unsupported', 'value')).toThrowError(
        "LocalNavie does not support option 'unsupported'"
      );
    });
  });

  describe('ask', () => {
    describe('when invoked with a threadId', () => {
      let navieImpl: Navie.INavie;
      let tokens: string[];
      const answer = ["It's", ' 42'];

      beforeEach(() => {
        navieImpl = new EventEmitter() as unknown as Navie.INavie;
        navieImpl.execute = jest.fn().mockImplementation((): AsyncIterable<string> => {
          return (async function* () {
            for (const word of answer) {
              yield word;
            }
          })();
        });

        jest.mocked(navieFn).mockReturnValue(navieImpl);

        tokens = new Array<string>();
        navie.on('token', (token: string) => tokens.push(token));
      });

      const awaitResponse = (resolve: () => void) => {
        navie.on('complete', () => {
          expect(tokens.join('')).toEqual("It's 42");
          resolve();
        });
      };

      it('uses the threadId and processes the question', async () => {
        navie.on('ack', (_messageId: string, threadId: string) =>
          expect(threadId).toBe('the-thread-id')
        );

        await new Promise<void>((resolve) => {
          awaitResponse(resolve);
          navie.ask('the-thread-id', 'What is the meaning of life?', undefined);
        });
      });

      describe('when invoked without a threadId', () => {
        it('allocates a new threadId', async () => {
          navie.on('ack', (_messageId: string, threadId: string) => {
            expect(threadId).toBeDefined();
          });

          await new Promise<void>((resolve) => {
            awaitResponse(resolve);
            navie.ask(undefined, 'What is the meaning of life?', undefined);
          });
        });
      });
    });
  });
});
