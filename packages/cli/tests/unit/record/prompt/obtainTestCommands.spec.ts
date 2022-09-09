import sinon from 'sinon';

import * as configuration from '../../../../src/cmds/record/configuration';
import UI from '../../../../src/cmds/userInteraction';
import * as guessTestCommands from '../../../../src/cmds/record/action/guessTestCommands';
import obtainTestCommands from '../../../../src/cmds/record/prompt/obtainTestCommands';
import RecordContext from '../../../../src/cmds/record/recordContext';
import TempConfig from '../tempConfig';

describe('record.prompt.obtainTestCommands', () => {
  const testCommand = {
    env: {},
    command: 'bundle exec rspec',
  } as configuration.TestCommand;

  let stubConfirm: sinon.SinonStub;
  let config: TempConfig;
  let context: RecordContext;

  beforeEach(() => {
    stubConfirm = sinon.stub(UI, 'confirm');
    config = new TempConfig();
    context = new RecordContext(config);
    return context.initialize();
  });
  afterEach(() => sinon.restore());

  async function promptForTestCommandAndEnv() {
    const stubPrompt = sinon.stub(UI, 'prompt');

    stubPrompt.onFirstCall().resolves({ testCommand: testCommand.command });
    stubPrompt.onSecondCall().resolves({ envVars: '' });

    stubConfirm.withArgs(`Continue with this command?`).resolves(true);

    await obtainTestCommands(context);

    expect(config.configOption('test_recording.test_commands', '')).toEqual([
      testCommand,
    ]);
  }

  describe('when commands are guessed', () => {
    beforeEach(() =>
      sinon.stub(guessTestCommands, 'default').resolves([testCommand])
    );

    describe('and confirmed', () => {
      beforeEach(() =>
        stubConfirm.withArgs('Use this suggested test command?').resolves(true)
      );

      it('saves the selection and prompts to continue', async () => {
        sinon
          .stub(UI, 'continue')
          .withArgs('Press enter to continue')
          .resolves();

        await obtainTestCommands(context);

        expect(config.configOption('test_recording.test_commands', '')).toEqual(
          [testCommand]
        );
      });
    });
    describe('and not confirmed', () => {
      beforeEach(() =>
        stubConfirm.withArgs('Use this suggested test command?').resolves(false)
      );

      it('prompts for test command and env', promptForTestCommandAndEnv);
    });
  });
  describe('when commands are entered manually', () => {
    beforeAll(() => sinon.stub(guessTestCommands, 'default').resolves([]));

    it('prompts for test command and env', promptForTestCommandAndEnv);

    it('test command must not be blank', async () => {
      const stubPrompt = sinon.stub(UI, 'prompt');

      stubPrompt.onFirstCall().resolves({ testCommand: null });
      stubPrompt.onSecondCall().resolves({ testCommand: '' });
      stubPrompt.onThirdCall().resolves({ testCommand: testCommand.command });
      stubPrompt.onCall(3).resolves({ envVars: '' });

      stubConfirm.withArgs(`Continue with this command?`).resolves(true);

      await obtainTestCommands(context);

      expect(config.configOption('test_recording.test_commands', '')).toEqual([
        testCommand,
      ]);
    });
  });
});
