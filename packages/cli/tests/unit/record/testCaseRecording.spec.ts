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
      const command = process.platform === 'win32' ? 'node .\\tests\\sleeper.js 10' : 'sleep 0.01';
      config.setConfigOption('test_recording.test_commands', [
        {
          command,
        } as TestCommand,
      ]);

      const stubUI = sinon.stub(UI, 'progress');

      await TestCaseRecording.start(context);
      await TestCaseRecording.waitFor(context);
      
      const expected = [
        `Running test command: ${command}`,
      ]

      expect(stubUI.getCalls().map((c) => c.firstArg)).toEqual(expected);
    });
  });

  describe('with a slow test command', () => {
    it('starts and kills the command', async () => {
      const command = process.platform === 'win32' ? 'node .\\tests\\sleeper.js 1000' : 'sleep 1';
      config.setConfigOption('test_recording.test_commands', [
        {
          command,
        } as TestCommand,
      ]);
      config.setSetting('test_recording.max_time', 0.01);

      const stubUI = sinon.stub(UI, 'progress');

      await TestCaseRecording.start(context);
      await TestCaseRecording.waitFor(context);
      const fullExpectedCommand = process.platform === 'win32' ? 
        'C:\\Windows\\system32\\cmd.exe /d /s /c "node .\\tests\\sleeper.js 1000"' : 
        '/bin/sh -c sleep 1';

      const expected = [
        'Running tests for up to 0.01 seconds',
        `Running test command: ${command}`,
        `Stopping test command after 0.01 seconds: ${fullExpectedCommand}`,
      ];

      if (process.platform === 'win32') {
        // windows will throw an error when a process is killed using the pid
        const windowsError = `\nTest command failed with status code 1: ${fullExpectedCommand}`;
        expected.push(windowsError);
      }
      
      // different windows machines have different paths where cmd.exe is stored
      // for example: C:\WINDOWS\system32\cmd.exe vs. C:\Windows\system32\cmd.exe
      const actual = stubUI.getCalls().map((c) => {
        return c.firstArg.replace(/windows/ig, 'Windows');
      });

      expect(actual).toEqual(expected);
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

      let fullExpectedCommand: string;
      let expectedErrorCode: string;

      if (process.platform === 'win32') {
        fullExpectedCommand = 'C:\\Windows\\system32\\cmd.exe /d /s /c "foobar"';
        expectedErrorCode = '1';
      } else {
        fullExpectedCommand = '/bin/sh -c foobar';
        expectedErrorCode = '127'
      }

      const expected = [
        'Running test command: foobar',
        `
Test command failed with status code ${expectedErrorCode}: ${fullExpectedCommand}`,
      ]; 

      const actual = stubUI.getCalls().map((c) => {
        return c.firstArg.replace(/windows/ig, 'Windows');
      });

      expect(actual).toEqual(expected);
    });
  });
});
