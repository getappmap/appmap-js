import { RequestOptions } from 'http';
import sinon from 'sinon';
import UI from '../../../src/cmds/userInteraction';
import { State } from '../../../src/cmds/record/types/state';
import * as remote from '../../../src/cmds/record/state/record_remote';
import * as configuration from '../../../src/cmds/record/configuration';
import * as isAgentAvailable from '../../../src/cmds/record/test/isAgentAvailable';
import * as isRecordingInProgress from '../../../src/cmds/record/test/isRecordingInProgress';
import * as agentAvailableAndReady from '../../../src/cmds/record/state/agentAvailableAndReady';
import * as agentIsRecording from '../../../src/cmds/record/state/agentIsRecording';
import * as agentNotAvailable from '../../../src/cmds/record/state/agentNotAvailable';
import * as detectProcessCharacteristics from '../../../src/cmds/record/action/detectProcessCharacteristics';
import * as agentProcessNotRunning from '../../../src/cmds/record/state/agentProcessNotRunning';
import * as configureHostAndPort from '../../../src/cmds/record/action/configureHostAndPort';
import RecordContext from '../../../src/cmds/record/recordContext';
import { inspect } from 'util';
import * as continueWithRequestOptionConfiguration from '../../../src/cmds/record/prompt/continueWithRequestOptionConfiguration';
import * as configureRemainingRequestOptions from '../../../src/cmds/record/action/configureRemainingRequestOptions';

describe('record remote', () => {
  let prompt: sinon.SinonStub,
    options: RequestOptions = {},
    recordContext: RecordContext,
    appMapDir = '.';

  beforeEach(() => (recordContext = new RecordContext(appMapDir)));

  beforeEach(() => {
    sinon.stub(configuration, 'requestOptions').resolves(options);
    sinon.stub(configuration, 'readSetting');
    sinon.stub(configuration, 'writeSetting');
    prompt = sinon.stub(UI, 'prompt');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('agent is not avaliable', () => {
    beforeEach(() => sinon.stub(isAgentAvailable, 'default').resolves(false));

    it('begins the configuration process', async () => {
      recordContext.recordMethod = 'remote';

      const next = await remote.default(recordContext);
      expect(inspect(recordContext)).toEqual(
        `RecordContext {
  appMapDir: '.',
  recordMethod: 'remote',
  url: 'http://localhost:3000/'
}`
      );
      expect(next).toEqual(agentNotAvailable.default);
    });

    describe('agent process is not detected', () => {
      beforeEach(() =>
        sinon.stub(detectProcessCharacteristics, 'default').resolves(false)
      );

      describe('user is sure that the host/port is correct', () => {
        beforeEach(() =>
          sinon
            .stub(continueWithRequestOptionConfiguration, 'default')
            .resolves(
              continueWithRequestOptionConfiguration.ConfigurationAction
                .RequestOptions
            )
        );
        it('prompts for extended options', async () => {
          let next: State | string | undefined = await remote.default(
            recordContext
          );
          expect(next).toEqual(agentNotAvailable.default);

          sinon.stub(configureRemainingRequestOptions, 'default').resolves();

          next = await next(recordContext);
          expect(next).toEqual(remote.default);
          expect(inspect(recordContext)).toEqual(
            `RecordContext { appMapDir: '.', url: 'http://localhost:3000/' }`
          );
        });
      });

      describe('user is not sure that the host/port is correct', () => {
        beforeEach(() =>
          sinon
            .stub(continueWithRequestOptionConfiguration, 'default')
            .resolves(
              continueWithRequestOptionConfiguration.ConfigurationAction
                .HostAndPort
            )
        );
        it('re-prompts for host and port', async () => {
          let next: State | string | undefined = await remote.default(
            recordContext
          );
          expect(next).toEqual(agentNotAvailable.default);
          next = await next(recordContext);
          expect(next).toEqual(agentProcessNotRunning.default);
          expect(inspect(recordContext)).toEqual(
            `RecordContext { appMapDir: '.', url: 'http://localhost:3000/' }`
          );

          sinon.stub(configureHostAndPort, 'default').resolves();

          expect(await (next as State)(recordContext)).toEqual(remote.default);
          expect(inspect(recordContext)).toEqual(
            `RecordContext { appMapDir: '.', url: 'http://localhost:3000/' }`
          );
        });
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
        const next = await remote.default(recordContext);
        expect(inspect(recordContext)).toEqual(
          `RecordContext { appMapDir: '.', url: 'http://localhost:3000/' }`
        );
        expect(next).toEqual(agentAvailableAndReady.default);
      });
    });
    describe('agent is recording', () => {
      beforeEach(() =>
        sinon.stub(isRecordingInProgress, 'default').resolves(true)
      );

      it('tries to handle the existing recording', async () => {
        const next = await remote.default(recordContext);
        expect(inspect(recordContext)).toEqual(
          `RecordContext { appMapDir: '.', url: 'http://localhost:3000/' }`
        );
        expect(next).toEqual(agentIsRecording.default);
      });
    });
  });
});
