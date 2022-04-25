import sinon from 'sinon';
import UI from '../../../src/cmds/userInteraction';
import * as test from '../../../src/cmds/record/state/record_test';
import * as startTestCases from '../../../src/cmds/record/action/startTestCases';
import * as testCommandsNeeded from '../../../src/cmds/record/state/testCommandsNeeded';
import * as testCommandsAvailable from '../../../src/cmds/record/state/testCommandsAvailable';
import * as testCasesRunning from '../../../src/cmds/record/state/testCasesRunning';
import * as testCasesComplete from '../../../src/cmds/record/state/testCasesComplete';
import * as areTestCommandsConfigured from '../../../src/cmds/record/test/areTestCommandsConfigured';
import * as obtainTestCommands from '../../../src/cmds/record/prompt/obtainTestCommands';
import TestCaseRecording from '../../../src/cmds/record/testCaseRecording';

describe('record remote', () => {
  let prompt: sinon.SinonStub;

  beforeEach(() => {
    prompt = sinon.stub(UI, 'prompt');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('test command is not configured', () => {
    beforeEach(() =>
      sinon.stub(areTestCommandsConfigured, 'default').resolves(false)
    );

    it('prompts for commands', async () => {
      const next = await test.default();
      expect(next).toEqual(testCommandsNeeded.default);
    });
  });

  describe('test commands are needed', () => {
    it('obtains test commands', async () => {
      const stubObtain = sinon.stub(obtainTestCommands, 'default').resolves();

      const next = await testCommandsNeeded.default();
      expect(next).toEqual(testCommandsAvailable.default);

      expect(stubObtain.calledOnce).toBeTruthy();
    });
  });

  describe('test command is configured', () => {
    beforeEach(() =>
      sinon.stub(areTestCommandsConfigured, 'default').resolves(true)
    );

    it('is ready to run test cases', async () => {
      const next = await test.default();
      expect(next).toEqual(testCommandsAvailable.default);
    });
  });

  describe('is ready to run tests', () => {
    it('starts test cases', async () => {
      const stubStart = sinon.stub(startTestCases, 'default').resolves();

      const next = await testCommandsAvailable.default();
      expect(next).toEqual(testCasesRunning.default);

      expect(stubStart.calledOnce).toBeTruthy();
    });
  });

  describe('is running tests', () => {
    it('waits for test completion', async () => {
      const stubWait = sinon.stub(TestCaseRecording, 'waitFor').resolves();

      const next = await testCasesRunning.default();
      expect(next).toEqual(testCasesComplete.default);

      expect(stubWait.calledOnce).toBeTruthy();
    });
  });
});
