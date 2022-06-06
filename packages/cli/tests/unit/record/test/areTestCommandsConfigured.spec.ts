import sinon from 'sinon';

import * as configuration from '../../../../src/cmds/record/configuration';
import UI from '../../../../src/cmds/userInteraction';
import areTestCasesConfigured from '../../../../src/cmds/record/test/areTestCommandsConfigured';

describe('record.test.areTestCommandsConfigured', () => {
  let prompt: sinon.SinonStub;

  beforeEach(() => (prompt = sinon.stub(UI, 'prompt')));

  afterEach(() => sinon.restore());

  describe('when config contains test commands', () => {
    beforeEach(() => {
      sinon
        .stub(configuration, 'readConfigOption')
        .withArgs('test_recording.test_commands', [])
        .resolves([
          {
            command: 'bundle exec rails test',
          } as configuration.TestCommand,
        ]);
    });
    it('prompts the user to accept and use those commands', async () => {
      prompt.onCall(0).resolves({ useTestCommands: true });

      const result = await areTestCasesConfigured();
      expect(result).toBeTruthy();
    });
  });

  describe('when config does not contain test commands', () => {
    it('returns false', async () => {
      const result = await areTestCasesConfigured();
      expect(result).toBeFalsy();
    });
  });
});
