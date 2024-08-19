/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import EventEmitter from 'events';
import { navie as navieFn, Navie } from '@appland/navie';

import LocalNavie from '../../../../src/rpc/explain/navie/navie-local';
import History from '../../../../src/rpc/explain/navie/history';
import Thread from '../../../../src/rpc/explain/navie/thread';

jest.mock('@appland/navie');
jest.mock('../../../../src/rpc/explain/navie/history');

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
    let thread: Thread;
    let timestamp: number;
    let projectDirectories: string[];

    let mockHistoryLoad: jest.SpyInstance;
    let mockHistoryQuestion: jest.SpyInstance;
    let mockHistoryToken: jest.SpyInstance;

    beforeEach(() => {
      timestamp = Date.now();
      projectDirectories = ['dir-1'];
      thread = new Thread('the-thread-id', timestamp, projectDirectories);

      mockHistoryLoad = jest
        .spyOn(History.prototype, 'load')
        .mockImplementation(async (_threadId: string) => {
          return thread;
        });
      mockHistoryQuestion = jest.spyOn(History.prototype, 'question');
      mockHistoryToken = jest.spyOn(History.prototype, 'token');
    });

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
        let allocatedThreadId: string;
        navie.on('ack', (_messageId: string, threadId: string) => {
          expect(threadId).toBe('the-thread-id');
          allocatedThreadId = threadId;
        });

        await new Promise<void>((resolve) => {
          awaitResponse(() => {
            expect(mockHistoryLoad).toHaveBeenCalledWith(allocatedThreadId);

            resolve();
          });
          navie.ask('the-thread-id', 'What is the meaning of life?');
        });
      });

      describe('when invoked without a threadId', () => {
        it('should assign a thread id if not provided', async () => {
          const mockThreadId = 'mock-thread-id';
          navie.setThreadId(mockThreadId);

          const question = 'What is the meaning of life?';
          await navie.ask(undefined, question);

          expect(mockHistoryLoad).toHaveBeenCalledWith(mockThreadId);
        });

        it('allocates a new threadId', async () => {
          let allocatedThreadId: string;

          navie.on('ack', (_messageId: string, threadId: string) => {
            expect(threadId).toBeDefined();
            allocatedThreadId = threadId;
          });

          await new Promise<void>((resolve) => {
            awaitResponse(() => {
              expect(mockHistoryLoad).toHaveBeenCalledWith(allocatedThreadId);

              resolve();
            });
            navie.ask(undefined, 'What is the meaning of life?');
          });
        });
      });
    });
  });
});
