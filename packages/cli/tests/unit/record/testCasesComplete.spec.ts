import sinon from 'sinon';
import 'jest-sinon';
import RecordContext from '../../../src/cmds/record/recordContext';
import testCasesComplete from '../../../src/cmds/record/state/testCasesComplete';
import * as openTicket from '../../../src/lib/ticket/openTicket';

describe('testCasesComplete', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('opening tickets', () => {
    let rc: RecordContext, openTicketStub: sinon.SinonStub;

    beforeEach(() => {
      rc = new RecordContext('.');
      sinon.stub(rc, 'output').value(['']);
      openTicketStub = sinon.stub(openTicket, 'openTicket').resolves();
    });

    it('opens a ticket when test commands fail', async () => {
      sinon.stub(rc, 'failures').value(1);

      await testCasesComplete(rc);

      expect(openTicketStub).toBeCalledOnce();
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
