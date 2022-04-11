import { RequestOptions } from 'http';
import sinon from 'sinon';
import UI from '../../../src/cmds/userInteraction';
import { State } from '../../../src/cmds/record/types/state';
import * as initial from '../../../src/cmds/record/state/initial';
import * as configuration from '../../../src/cmds/record/configuration';
import * as isAgentAvailable from '../../../src/cmds/record/test/isAgentAvailable';
import * as isRecordingInProgress from '../../../src/cmds/record/test/isRecordingInProgress';
import * as agentAvailableAndReady from '../../../src/cmds/record/state/agentAvailableAndReady';
import * as agentIsRecording from '../../../src/cmds/record/state/agentIsRecording';
import * as agentNotAvailable from '../../../src/cmds/record/state/agentNotAvailable';
import * as detectProcessCharacteristics from '../../../src/cmds/record/action/detectProcessCharacteristics';
import * as agentProcessNotRunning from '../../../src/cmds/record/state/agentProcessNotRunning';
import * as configureHostAndPort from '../../../src/cmds/record/action/configureHostAndPort';

describe('record command', () => {
  let readSetting: sinon.SinonStub,
    writeSetting: sinon.SinonStub,
    prompt: sinon.SinonStub,
    options: RequestOptions = {};

  beforeEach(() => {
    readSetting = sinon.stub(configuration, 'requestOptions').resolves(options);
    readSetting = sinon.stub(configuration, 'readSetting');
    writeSetting = sinon.stub(configuration, 'writeSetting');
    prompt = sinon.stub(UI, 'prompt');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('agent is not avaliable', () => {
    beforeEach(() => sinon.stub(isAgentAvailable, 'default').resolves(false));

    it('tries to get the agent ready', async () => {
      const next = await initial.default();
      expect(next).toEqual(agentNotAvailable.default);
    });

    describe('agent process is not detected', () => {
      beforeEach(() =>
        sinon.stub(detectProcessCharacteristics, 'default').resolves(false)
      );

      it('tries to get the agent running', async () => {
        let next: State | string | undefined = await initial.default();
        next = await next();
        expect(next).toEqual(agentProcessNotRunning.default);

        sinon.stub(configureHostAndPort, 'default').resolves();

        expect(await (next as State)()).toEqual(initial.default);
      });
    });
  });

  describe('agent is avaliable', () => {
    beforeEach(() => sinon.stub(isAgentAvailable, 'default').resolves(true));

    describe('agent is not recording', () => {
      beforeEach(() =>
        sinon.stub(isRecordingInProgress, 'default').resolves(false)
      );

      it('is ready to record', async () => {
        const next = await initial.default();
        expect(next).toEqual(agentAvailableAndReady.default);
      });
    });
    describe('agent is recording', () => {
      beforeEach(() =>
        sinon.stub(isRecordingInProgress, 'default').resolves(true)
      );

      it('tries to handle the existing recording', async () => {
        const next = await initial.default();
        expect(next).toEqual(agentIsRecording.default);
      });
    });
  });
});
