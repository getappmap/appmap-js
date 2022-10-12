import sinon from 'sinon';
import 'jest-sinon';
import RecordContext from '../../../src/cmds/record/recordContext';
import testCasesComplete from '../../../src/cmds/record/state/testCasesComplete';
import * as openTicket from '../../../src/lib/ticket/openTicket';
import Configuration from '../../../src/cmds/record/configuration';
import UI from '../../../src/cmds/userInteraction';

describe('testCasesComplete', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('opening tickets', () => {
    let rc: RecordContext, openTicketStub: sinon.SinonStub;

    beforeEach(() => {
      rc = new RecordContext(new Configuration());
      sinon.stub(rc, 'output').value(['']);
      openTicketStub = sinon.stub(openTicket, 'default').resolves();
      return rc.initialize();
    });

    it('opens a ticket when test commands fail', async () => {
      sinon.stub(rc, 'failures').value(1);
      sinon.stub(rc, 'appMapsCreated').value(42);

      await testCasesComplete(rc);

      expect(openTicketStub).toBeCalledOnce();
    });

    it('warns when a failed run did not produce appmaps', async () => {
      const warn = sinon.stub(UI, 'warn');

      sinon.stub(rc, 'failures').value(1);
      sinon.stub(rc, 'appMapsCreated').value(0);

      await testCasesComplete(rc);

      expect(warn).toBeCalledWithMatch(/AppMaps/);
    });

    it("is not a failure if 'No examples found.' from rspec", async () => {
      sinon.stub(rc, 'output').value([
        `No examples found.


Finished in 0.00025 seconds (files took 0.03966 seconds to load)
0 examples, 0 failures

`,
      ]);
      sinon.stub(rc, 'failures').value(1);

      await testCasesComplete(rc);

      expect(openTicketStub).not.toBeCalled();
    });

    it('does not show a misleading message when failed run produces appmaps', async () => {
      const warn = sinon.stub(UI, 'warn');

      sinon.stub(rc, 'failures').value(1);
      sinon.stub(rc, 'appMapsCreated').value(42);

      await testCasesComplete(rc);

      expect(warn).not.toBeCalledWithMatch(/AppMaps/);
    });

    describe('when test commands succeed', () => {
      beforeEach(() => {
        sinon.stub(rc, 'failures').value(0);
      });

      it('opens a ticket when no AppMaps are created', async () => {
        sinon.stub(rc, 'appMapsCreated').value(0);

        await testCasesComplete(rc);

        expect(openTicketStub).toBeCalledOnce();
      });

      it('does not open a ticket when AppMaps are created', async () => {
        sinon.stub(rc, 'appMapsCreated').value(1);

        await testCasesComplete(rc);

        expect(openTicketStub).not.toBeCalled();
      });
    });
  });
});
