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
import RecordContext, { RecordProcessResult } from '../../../src/cmds/record/recordContext';
import Configuration from '../../../src/cmds/record/configuration';
import RecordCommand from '../../../src/cmds/record/record';
const { tmpdir } = require('os');
const {
  openSync,
  closeSync,
  symlinkSync,
  existsSync,
  unlink,
  rmdir,
  mkdir,
  renameSync,
} = require('fs');

describe('record test', () => {
  let confirm: sinon.SinonStub,
    prompt: sinon.SinonStub,
    cont: sinon.SinonStub,
    recordContext: RecordContext;

  beforeEach(() => {
    const config = new Configuration();
    sinon.stub(config, 'read');
    sinon.stub(config, 'write');
    recordContext = new RecordContext(config);
    return recordContext.initialize();
  });

  beforeEach(() => {
    confirm = sinon.stub(UI, 'confirm');
    prompt = sinon.stub(UI, 'prompt');
    cont = sinon.stub(UI, 'continue');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('test command is not configured', () => {
    beforeEach(() => sinon.stub(areTestCommandsConfigured, 'default').resolves(false));

    it('prompts for commands', async () => {
      recordContext.recordMethod = 'test';

      const next = await test.default(recordContext);
      expect(recordContext).toMatchObject<Partial<RecordContext>>({
        appMapDir: '.',
        recordMethod: 'test',
      });
      expect(next).toEqual(testCommandsNeeded.default);
    });
  });

  describe('test commands are needed', () => {
    it('obtains test commands', async () => {
      const stubObtain = sinon.stub(obtainTestCommands, 'default').resolves();

      const next = await testCommandsNeeded.default(recordContext);
      expect(recordContext).toMatchObject<Partial<RecordContext>>({
        appMapDir: '.',
        testCommands: [],
      });
      expect(next).toEqual(testCommandsAvailable.default);

      expect(stubObtain.calledOnce).toBeTruthy();
    });
  });

  describe('record test with invalid directory parameter', () => {
    it('stops if directory parameter is file instead of directory', async () => {
      const dirPrefix = tmpdir();
      const directoryParam = `${dirPrefix}/file_not_dir`;
      closeSync(openSync(directoryParam, 'w'));
      expect(existsSync(directoryParam)).toEqual(true);

      let argv = {
        _: ['record', 'test'],
        $0: 'src/cli.ts',
        directory: directoryParam,
        d: dirPrefix,
      };

      const ret = await RecordCommand.handler(argv);
      expect(ret).toEqual(null);

      await unlink(directoryParam, (err) => {});
    });

    it('stops if directory parameter is invalid symlink', async () => {
      const dirPrefix = tmpdir();
      const symlinkDst = `${dirPrefix}/symlink_dst`;
      const symlinkSrc = `${dirPrefix}/symlink_src`;
      const symlinkDstRenamed = `${dirPrefix}/symlink_dst_renamed`;

      await unlink(symlinkSrc, (err) => {});
      await rmdir(symlinkDst, (err) => {});
      await rmdir(symlinkDstRenamed, (err) => {});

      // create symlink
      await mkdir(symlinkDst, (err) => {});
      symlinkSync(symlinkDst, symlinkSrc);
      expect(existsSync(symlinkDst)).toEqual(true);
      expect(existsSync(symlinkSrc)).toEqual(true); // symlink is valid

      // the symlink was created. now break its destination
      renameSync(symlinkDst, symlinkDstRenamed);
      expect(existsSync(symlinkDstRenamed)).toEqual(true);
      expect(existsSync(symlinkDst)).toEqual(false);
      expect(existsSync(symlinkSrc)).toEqual(false); // now it's invalid

      let argv = {
        _: ['record', 'test'],
        $0: 'src/cli.ts',
        directory: symlinkSrc,
        d: dirPrefix,
      };
      const ret = await RecordCommand.handler(argv);
      await unlink(symlinkSrc, (err) => {});
      await rmdir(symlinkDst, (err) => {});
      await rmdir(symlinkDstRenamed, (err) => {});
      expect(ret).toEqual(null);
    });
  });

  describe('test command is configured', () => {
    beforeEach(() => sinon.stub(areTestCommandsConfigured, 'default').resolves(true));

    it('is ready to run test cases', async () => {
      const next = await test.default(recordContext);
      expect(recordContext).toMatchObject<Partial<RecordContext>>({
        appMapDir: '.',
        testCommands: [],
      });
      expect(next).toEqual(testCommandsAvailable.default);
    });
  });

  describe('is ready to run tests', () => {
    it('starts test cases', async () => {
      const stubStart = sinon.stub(startTestCases, 'default').resolves();

      const next = await testCommandsAvailable.default(recordContext);
      expect(recordContext).toMatchObject<Partial<RecordContext>>({
        appMapDir: '.',
        maxTime: 30,
      });
      expect(next).toEqual(testCasesRunning.default);

      expect(stubStart.calledOnce).toBeTruthy();
    });
  });

  describe('is running tests', () => {
    beforeEach(async () => {
      sinon.stub(countAppMaps, 'default').onCall(0).resolves(0).onCall(1).resolves(10);
      await recordContext.initialize();
    });

    it('which all succeed', async () => {
      const stubWait = sinon.stub(TestCaseRecording, 'waitFor').resolves();
      sinon.stub(recordContext, 'results').value([{ exitCode: 0 }]);

      const next = await testCasesRunning.default(recordContext);

      expect(next).toEqual(testCasesComplete.default);
      expect(stubWait.calledOnce).toBeTruthy();

      await next(recordContext);

      expect(recordContext).toMatchObject<Partial<RecordContext>>({
        appMapDir: '.',
        initialAppMapCount: 0,
        results: [{ exitCode: 0 } as RecordProcessResult],
        appMapCount: 10,
      });
      expect(recordContext.properties()).toEqual({
        exitCodes: '0',
        // eslint-disable-next-line prettier/prettier
        log: `
===

===
`,
      });
    });
    it('and some fail', async () => {
      const stubWait = sinon.stub(TestCaseRecording, 'waitFor').resolves();
      confirm.resolves(false);
      sinon.stub(recordContext, 'results').value([{ exitCode: 1 }]);
      prompt.resolves({ openTicket: false });

      const next = await testCasesRunning.default(recordContext);

      expect(next).toEqual(testCasesComplete.default);
      expect(stubWait.calledOnce).toBeTruthy();

      await next(recordContext);
      cont.resolves();

      expect(recordContext).toMatchObject<Partial<RecordContext>>({
        appMapDir: '.',
        initialAppMapCount: 0,
        results: [{ exitCode: 1 } as RecordProcessResult],
        appMapCount: 10,
      });
      expect(recordContext.properties()).toEqual({
        exitCodes: '1',
        // eslint-disable-next-line prettier/prettier
        log: `
===

===
`,
      });
    });
  });
});
