import * as sinon from 'sinon';
import { inspect } from 'util';
import * as countAppMaps from '../../../../src/cmds/record/action/countAppMaps';
import RecordContext from '../../../../src/cmds/record/recordContext';
import TempConfig from '../tempConfig';

describe('RecordContext', function () {
  afterEach(sinon.restore);

  describe('when generating metrics', () => {
    it('correctly reports counts of 0 items', async () => {
      sinon
        .stub(countAppMaps, 'default')
        .onCall(0)
        .resolves(0)
        .onCall(1)
        .resolves(0);

      const rc = new RecordContext(new TempConfig());
      await rc.initialize();
      await rc.populateAppMapCount();
      rc.appMapEventCount = 0;
      expect(inspect(rc.metrics())).toEqual(
        '{ initialAppMapCount: 0, appMapCount: 0, appMapEventCount: 0 }'
      );
    });
  });
});
