import 'jest-sinon';
import sinon from 'sinon';
import yargs from 'yargs';
import { RemoteRecordingError } from '../../../src/cmds/record/makeRequest';
import * as initial from '../../../src/cmds/record/state/initial';
import * as openTicket from '../../../src/lib/ticket/openTicket';
import recordCmd from '../../../src/cmds/record/record';
import UI from '../../../src/cmds/userInteraction';

describe('record', () => {
  const parser = yargs.command(recordCmd);
  const runCommand = async () => {
    const cmdLine = `record remote`;
    await new Promise((resolve, reject) => {
      parser.parse(cmdLine, {}, (err, argv, output) => {
        if (err) {
          reject(err);
        } else {
          resolve(output);
        }
      });
    });
  };

  describe('handling tickets', () => {
    let initialStateStub: sinon.SinonStub,
      promptStub: sinon.SinonStub,
      openTicketStub: sinon.SinonStub;

    beforeEach(() => {
      initialStateStub = sinon.stub(initial, 'createState');
      promptStub = sinon.stub(UI, 'prompt');
      openTicketStub = sinon.stub(openTicket, 'default');
      openTicketStub.resolves();
    });
    afterEach(() => {
      sinon.restore();
    });

    it("doesn't open a ticket when no exception is thrown", async () => {
      // Terminate the state machine immediately.
      initialStateStub.resolves(() => undefined);

      await runCommand();

      expect(openTicketStub).not.toBeCalled();
    });

    it('opens a ticket when a state throws a remote recording exception', async () => {
      // Stub the initial state so it throws an exception when entered.
      initialStateStub.resolves(() => {
        throw new RemoteRecordingError('testing', 500, 'GET', '/', 'fail');
      });

      // Don't need to see the server response
      promptStub
        .withArgs(sinon.match({ name: 'showResponse', type: 'confirm' }))
        .resolves({ showResponse: false });

      await runCommand();

      // The user should have been offered the chance to open a ticket
      expect(openTicketStub).toHaveBeenCalledOnce();
    });
  });
});
