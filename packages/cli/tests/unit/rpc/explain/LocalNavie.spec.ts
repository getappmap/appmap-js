import LocalNavie from '../../../../src/rpc/explain/navie/navie-local';
import LegacyHistory from '../../../../src/rpc/navie/legacy/history';
import { container } from 'tsyringe';
import ThreadService from '../../../../src/rpc/navie/services/threadService';

jest.mock('@appland/navie', () => ({
  ...jest.requireActual('@appland/navie'),
  navie: jest
    .fn()
    .mockReturnValue({
      on: jest.fn().mockReturnThis(),
      execute: jest.fn().mockImplementation(function* () {}),
    }),
}));
jest.mock('@appland/client', () => ({
  AI: {
    createUserMessage: jest.fn().mockResolvedValue({ id: 'user-message' }),
    createAgentMessage: jest.fn().mockResolvedValue({ id: 'assistant-message' }),
  },
}));

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

  describe('backwards compatibility', () => {
    let threadService: ThreadService;
    let originalEnv: NodeJS.ProcessEnv;
    let navie: LocalNavie;

    beforeEach(() => {
      navie = new LocalNavie(jest.fn(), jest.fn(), jest.fn());
      originalEnv = { ...process.env };
      process.env.APPMAP_TELEMETRY_DISABLED = '1';
      LegacyHistory.initialize = jest.fn();
      container.reset();
      threadService = {
        getThread: jest.fn().mockResolvedValue({ getChatHistory: jest.fn().mockReturnValue([]) }),
      } as unknown as ThreadService;
      container.registerInstance(ThreadService, threadService);
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    describe('ask', () => {
      it('uses LegacyHistory if `APPMAP_NAVIE_THREAD_LOG` is unset', async () => {
        delete process.env.APPMAP_NAVIE_THREAD_LOG;
        await navie.ask('threadId', 'question');
        expect(LegacyHistory.initialize).toHaveBeenCalled();
        expect(threadService.getThread).not.toHaveBeenCalled();
      });

      it('uses thread logs if `APPMAP_NAVIE_THREAD_LOG` is set', async () => {
        process.env.APPMAP_NAVIE_THREAD_LOG = '1';
        await navie.ask('threadId', 'question');
        expect(LegacyHistory.initialize).not.toHaveBeenCalled();
        expect(threadService.getThread).toHaveBeenCalled();
      });
    });
  });
});
