import sinon from 'sinon';

import * as configuration from '../../../../src/cmds/record/configuration';
import UI from '../../../../src/cmds/userInteraction';
import configureRemainingRequestOptions from '../../../../src/cmds/record/action/configureRemainingRequestOptions';
import TempConfig from '../tempConfig';
import RecordContext from '../../../../src/cmds/record/recordContext';

describe('record.action.configureRemainingRequestOptions', () => {
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

  it('accepts and saves agent path and protocol', async () => {
    prompt.onCall(0).resolves({ baseURL: '/myapp/' });
    prompt.onCall(1).resolves({ useSSL: true });

    await configureRemainingRequestOptions(context);

    const ro = config.requestOptions();

    expect(ro.hostname).toEqual('localhost');
    expect(ro.port).toEqual(3000);
    expect(ro.path).toEqual('/myapp/');
    expect(ro.protocol).toEqual('https:');
  });
});
