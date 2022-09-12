import 'jest-sinon';
import sinon from 'sinon';
import * as configureHostAndPort from '../../../src/cmds/record/action/configureHostAndPort';
import * as configureRemainingRequestOptions from '../../../src/cmds/record/action/configureRemainingRequestOptions';
import * as detectProcessCharacteristics from '../../../src/cmds/record/action/detectProcessCharacteristics';
import * as nameAppMap from '../../../src/cmds/record/action/nameAppMap';
import * as saveAppMap from '../../../src/cmds/record/action/saveAppMap';
import Configuration from '../../../src/cmds/record/configuration';
import * as continueWithRequestOptionConfiguration from '../../../src/cmds/record/prompt/continueWithRequestOptionConfiguration';
import * as recordingInProgress from '../../../src/cmds/record/prompt/recordingInProgress';
import RecordContext from '../../../src/cmds/record/recordContext';
import RemoteRecording from '../../../src/cmds/record/remoteRecording';
import * as agentAvailableAndReady from '../../../src/cmds/record/state/agentAvailableAndReady';
import * as agentIsRecording from '../../../src/cmds/record/state/agentIsRecording';
import * as agentNotAvailable from '../../../src/cmds/record/state/agentNotAvailable';
import * as agentProcessNotRunning from '../../../src/cmds/record/state/agentProcessNotRunning';
import * as remote from '../../../src/cmds/record/state/record_remote';
import * as isAgentAvailable from '../../../src/cmds/record/test/isAgentAvailable';
import * as isRecordingInProgress from '../../../src/cmds/record/test/isRecordingInProgress';
import { State } from '../../../src/cmds/record/types/state';
import UI from '../../../src/cmds/userInteraction';

function checkContext(
  context: RecordContext,
  props: Partial<RecordContext> = {}
) {
  expect(context).toMatchObject<Partial<RecordContext>>({
    appMapDir: '.',
    url: 'http://localhost:3000/',
    ...props,
  });
}

describe('record remote', () => {
  let prompt: sinon.SinonStub, recordContext: RecordContext;

  beforeEach(() => {
    prompt = sinon.stub(UI, 'prompt');
    const config = new Configuration();
    sinon.stub(config, 'read');
    sinon.stub(config, 'write');
    recordContext = new RecordContext(config);
    return recordContext.initialize();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('agent is not available', () => {
    beforeEach(() => sinon.stub(isAgentAvailable, 'default').resolves(false));

    it('begins the configuration process', async () => {
      recordContext.recordMethod = 'remote';

      const next = await remote.default(recordContext);
      checkContext(recordContext, { recordMethod: 'remote' });
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

          prompt.resolves({
            option: agentNotAvailable.NextStepChoices.CONFIGURE.value,
          });
          sinon.stub(configureRemainingRequestOptions, 'default').resolves();

          next = await next(recordContext);
          expect(next).toEqual(remote.default);
          checkContext(recordContext);
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
          checkContext(recordContext);

          sinon.stub(configureHostAndPort, 'default').resolves();

          expect(await (next as State)(recordContext)).toEqual(remote.default);
          checkContext(recordContext);
        });
      });
    });
  });

  describe('agent is available', () => {
    beforeEach(() => sinon.stub(isAgentAvailable, 'default').resolves(true));

    describe('agent is not recording', () => {
      beforeEach(() =>
        sinon.stub(isRecordingInProgress, 'default').resolves(false)
      );

      it('is ready to record', async () => {
        const next = await remote.default(recordContext);
        checkContext(recordContext);
        expect(next).toEqual(agentAvailableAndReady.default);
      });
    });
    describe('agent is recording', () => {
      beforeEach(() =>
        sinon.stub(isRecordingInProgress, 'default').resolves(true)
      );

      it('tries to handle the existing recording', async () => {
        const next = await remote.default(recordContext);
        checkContext(recordContext);
        expect(next).toEqual(agentIsRecording.default);
      });

      describe('recording is stopped', () => {
        beforeEach(() => {
          sinon
            .stub(recordingInProgress, 'default')
            .resolves(recordingInProgress.RecordingAction.Save);

          const appMapName = 'myAppMap';
          sinon.stub(nameAppMap, 'default').resolves(appMapName);
          sinon
            .stub(saveAppMap, 'default')
            .resolves(`${nameAppMap}.appmap.json`);
        });

        const EXAMPLES = [
          {
            description: 'is empty',
            stopResult: '',
            appMapCount: 0,
            appMapEventCount: 0,
          },
          {
            description: 'has no events',
            stopResult: JSON.stringify({ events: [] }),
            appMapCount: 1,
            appMapEventCount: 0,
          },
          {
            description: 'has an event',
            stopResult: JSON.stringify({ events: [{ id: 1 }] }),
            appMapCount: 1,
            appMapEventCount: 1,
          },
        ];

        EXAMPLES.forEach((e) => {
          it(e.description, async () => {
            sinon
              .stub(RemoteRecording.prototype, 'stop')
              .resolves(e.stopResult);

            let next: State | string | undefined = await remote.default(
              recordContext
            );
            next = await next(recordContext);
            expect(recordContext.appMapCount).toEqual(e.appMapCount);
            expect(recordContext.appMapEventCount).toEqual(e.appMapEventCount);
          });
        });
      });
    });
  });
});
