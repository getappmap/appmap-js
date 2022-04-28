import sinon from 'sinon';
import UI from '../../../src/cmds/userInteraction';
import * as test from '../../../src/cmds/record/state/record_test';
import * as countAppMaps from '../../../src/cmds/record/action/countAppMaps';
import * as startTestCases from '../../../src/cmds/record/action/startTestCases';
import * as testCommandsNeeded from '../../../src/cmds/record/state/testCommandsNeeded';
import * as testCommandsAvailable from '../../../src/cmds/record/state/testCommandsAvailable';
import * as testCasesRunning from '../../../src/cmds/record/state/testCasesRunning';
import * as testCasesComplete from '../../../src/cmds/record/state/testCasesComplete';
import * as areTestCommandsConfigured from '../../../src/cmds/record/test/areTestCommandsConfigured';
import * as obtainTestCommands from '../../../src/cmds/record/prompt/obtainTestCommands';
import TestCaseRecording from '../../../src/cmds/record/testCaseRecording';
import RecordContext from '../../../src/cmds/record/recordContext';
import { inspect } from 'util';

describe('record test', () => {
  let prompt: sinon.SinonStub,
    cont: sinon.SinonStub,
    recordContext: RecordContext,
    appMapDir = '.';

  beforeEach(() => (recordContext = new RecordContext(appMapDir)));

  beforeEach(() => {
    prompt = sinon.stub(UI, 'prompt');
    cont = sinon.stub(UI, 'continue');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('test command is not configured', () => {
    beforeEach(() =>
      sinon.stub(areTestCommandsConfigured, 'default').resolves(false)
    );

    it('prompts for commands', async () => {
      recordContext.recordMethod = 'test';

      const next = await test.default(recordContext);
      expect(inspect(recordContext)).toEqual(
        `RecordContext { appMapDir: '.', recordMethod: 'test' }`
      );
      expect(next).toEqual(testCommandsNeeded.default);
    });
  });

  describe('test commands are needed', () => {
    it('obtains test commands', async () => {
      const stubObtain = sinon.stub(obtainTestCommands, 'default').resolves();

      const next = await testCommandsNeeded.default(recordContext);
      expect(inspect(recordContext)).toEqual(
        `RecordContext { appMapDir: '.', testCommands: [] }`
      );
      expect(next).toEqual(testCommandsAvailable.default);

      expect(stubObtain.calledOnce).toBeTruthy();
    });
  });

  describe('test command is configured', () => {
    beforeEach(() =>
      sinon.stub(areTestCommandsConfigured, 'default').resolves(true)
    );

    it('is ready to run test cases', async () => {
      const next = await test.default(recordContext);
      expect(inspect(recordContext)).toEqual(
        `RecordContext { appMapDir: '.', testCommands: [] }`
      );
      expect(next).toEqual(testCommandsAvailable.default);
    });
  });

  describe('is ready to run tests', () => {
    it('starts test cases', async () => {
      const stubStart = sinon.stub(startTestCases, 'default').resolves();

      const next = await testCommandsAvailable.default(recordContext);
      expect(inspect(recordContext)).toEqual(
        `RecordContext { appMapDir: '.', maxTime: 30 }`
      );
      expect(next).toEqual(testCasesRunning.default);

      expect(stubStart.calledOnce).toBeTruthy();
    });
  });

  describe('is running tests', () => {
    beforeEach(() => sinon.stub(countAppMaps, 'default').resolves(10));

    it('which all succeed', async () => {
      const stubWait = sinon.stub(TestCaseRecording, 'waitFor').resolves([0]);

      const next = await testCasesRunning.default(recordContext);
      expect(next).toEqual(testCasesComplete.default);

      expect(stubWait.calledOnce).toBeTruthy();

      await next(recordContext);
      expect(inspect(recordContext)).toEqual(
        `RecordContext { appMapDir: '.', exitCodes: [ 0 ], appMapCount: 10 }`
      );
      expect(recordContext.properties()).toEqual({
        exitCodes: '0',
      });
    });
    it('and some fail', async () => {
      const stubWait = sinon.stub(TestCaseRecording, 'waitFor').resolves([1]);

      const next = await testCasesRunning.default(recordContext);
      expect(next).toEqual(testCasesComplete.default);

      expect(stubWait.calledOnce).toBeTruthy();

      await next(recordContext);

      cont.resolves();

      expect(inspect(recordContext)).toEqual(
        `RecordContext { appMapDir: '.', exitCodes: [ 1 ], appMapCount: 10 }`
      );
      expect(recordContext.properties()).toEqual({
        exitCodes: '1',
      });
    });
  });
});
