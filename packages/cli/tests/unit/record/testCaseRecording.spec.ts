import sinon from 'sinon';

import * as configuration from '../../../src/cmds/record/configuration';
import TestCaseRecording from '../../../src/cmds/record/testCaseRecording';
import UI from '../../../src/cmds/userInteraction';

describe('record.testCaseRecording', () => {
  afterEach(() => sinon.restore());

  describe('with a quick test command', () => {
    beforeEach(() =>
      sinon
        .stub(configuration, 'readConfigOption')
        .withArgs('test_recording.test_commands', [])
        .resolves([
          {
            command: 'sleep 0.01',
          } as configuration.TestCommand,
        ])
    );

    it('starts and waits for the command', async () => {
      const stubUI = sinon.stub(UI, 'progress');

      await TestCaseRecording.start();
      await TestCaseRecording.waitFor();

      expect(stubUI.getCalls().map((c) => c.firstArg)).toEqual([
        'Running test command: sleep 0.01',
      ]);
    });
  });

  describe('with a slow test command', () => {
    beforeEach(() =>
      sinon
        .stub(configuration, 'readConfigOption')
        .withArgs('test_recording.test_commands', [])
        .resolves([
          {
            command: 'sleep 1',
          } as configuration.TestCommand,
        ])
    );
    beforeEach(() =>
      sinon
        .stub(configuration, 'readSetting')
        .withArgs('test_recording.max_time', -1)
        .resolves(0.01)
    );

    it('starts and kills the command', async () => {
      const stubUI = sinon.stub(UI, 'progress');

      await TestCaseRecording.start();
      await TestCaseRecording.waitFor();

      expect(stubUI.getCalls().map((c) => c.firstArg)).toEqual([
        'Running tests for up to 0.01 seconds',
        'Running test command: sleep 1',
        `Stopping test command after 0.01 seconds: /bin/sh -c sleep 1`,
      ]);
    });
  });

  describe('with an invalid test command', () => {
    beforeEach(() =>
      sinon
        .stub(configuration, 'readConfigOption')
        .withArgs('test_recording.test_commands', [])
        .resolves([
          {
            command: 'foobar',
          } as configuration.TestCommand,
        ])
    );

    it('starts the command and reports the error', async () => {
      const stubUI = sinon.stub(UI, 'progress');

      await TestCaseRecording.start();
      await TestCaseRecording.waitFor();

      expect(stubUI.getCalls().map((c) => c.firstArg)).toEqual([
        'Running test command: foobar',
        'Test command failed with status code 127: /bin/sh -c foobar',
      ]);
    });
  });
});
