import sinon from 'sinon';

import UI from '../../../../src/cmds/userInteraction';
import areTestCasesConfigured from '../../../../src/cmds/record/test/areTestCommandsConfigured';
import TempConfig from '../tempConfig';
import RecordContext from '../../../../src/cmds/record/recordContext';
import { TestCommand } from '../../../../src/cmds/record/configuration';

describe('record.test.areTestCommandsConfigured', () => {
  let config: TempConfig;
  let prompt: sinon.SinonStub;
  let context: RecordContext;

  beforeEach(() => {
    config = new TempConfig();
    config.initialize();
    context = new RecordContext(config);
    return context.initialize();
  });

  beforeEach(() => (prompt = sinon.stub(UI, 'prompt')));

  afterEach(() => sinon.restore());

  describe('when config contains test commands', () => {
    it('prompts the user to accept and use those commands', async () => {
      config.setConfigOption('test_recording.test_commands', [
        {
          command: 'bundle exec rails test',
        } as TestCommand,
      ]);

      prompt.onCall(0).resolves({ useTestCommands: true });

      const result = await areTestCasesConfigured(context);
      expect(result).toBeTruthy();
    });
  });

  describe('when config does not contain test commands', () => {
    it('returns false', async () => {
      const result = await areTestCasesConfigured(context);
      expect(result).toBeFalsy();
    });
  });
});
