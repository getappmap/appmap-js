import sinon from 'sinon';

import { TestCommand } from '../../../src/cmds/record/configuration';
import RecordContext from '../../../src/cmds/record/recordContext';
import TestCaseRecording from '../../../src/cmds/record/testCaseRecording';
import UI from '../../../src/cmds/userInteraction';
import TempConfig from './tempConfig';

let config: TempConfig;
let context: RecordContext;

beforeEach(async () => {
  config = new TempConfig();
  await config.initialize();
  context = new RecordContext(config);
  return context.initialize();
});

describe('record.testCaseRecording', () => {
  afterEach(() => sinon.restore());

  describe('with a quick test command', () => {
    it('starts and waits for the command', async () => {
      config.setConfigOption('test_recording.test_commands', [
        {
          command: 'sleep 0.01',
        } as TestCommand,
      ]);

      const stubUI = sinon.stub(UI, 'progress');

      await TestCaseRecording.start(context);
      await TestCaseRecording.waitFor(context);

      expect(stubUI.getCalls().map((c) => c.firstArg)).toEqual([
        'Running test command: sleep 0.01',
      ]);
    });
  });

  describe('with a slow test command', () => {
    it('starts and kills the command', async () => {
      config.setConfigOption('test_recording.test_commands', [
        {
          command: 'sleep 1',
        } as TestCommand,
      ]);
      config.setSetting('test_recording.max_time', 0.01);

      const stubUI = sinon.stub(UI, 'progress');

      await TestCaseRecording.start(context);
      await TestCaseRecording.waitFor(context);

      expect(stubUI.getCalls().map((c) => c.firstArg)).toEqual([
        'Running tests for up to 0.01 seconds',
        'Running test command: sleep 1',
        `Stopping test command after 0.01 seconds: /bin/sh -c sleep 1`,
      ]);
    });
  });

  describe('with an invalid test command', () => {
    it('starts the command and reports the error', async () => {
      config.setConfigOption('test_recording.test_commands', [
        {
          command: 'foobar',
        } as TestCommand,
      ]);

      const stubUI = sinon.stub(UI, 'progress');

      await TestCaseRecording.start(context);
      await TestCaseRecording.waitFor(context);

      expect(stubUI.getCalls().map((c) => c.firstArg)).toEqual([
        'Running test command: foobar',
        `
Test command failed with status code 127: /bin/sh -c foobar`,
      ]);
    });
  });
});
