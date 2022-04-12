import sinon from 'sinon';

import * as configuration from '../../../../src/cmds/record/configuration';
import UI from '../../../../src/cmds/userInteraction';
import configureRemainingRequestOptions from '../../../../src/cmds/record/action/configureRemainingRequestOptions';
import TempConfig from '../tempConfig';

describe('record.configureRemainingRequestOptions', () => {
  let config: TempConfig;
  let prompt: sinon.SinonStub;

  beforeEach(() => (config = new TempConfig()));
  beforeEach(() => config.initialize());
  beforeEach(() => (prompt = sinon.stub(UI, 'prompt')));

  afterEach(() => config.cleanup());
  afterEach(() => sinon.restore());

  it('accepts and saves agent path and protocol', async () => {
    prompt.onCall(0).resolves({ baseURL: '/myapp/' });
    prompt.onCall(1).resolves({ useSSL: true });

    await configureRemainingRequestOptions();

    const ro = await configuration.requestOptions();

    expect(ro.hostname).toEqual('localhost');
    expect(ro.port).toEqual(3000);
    expect(ro.path).toEqual('/myapp/');
    expect(ro.protocol).toEqual('https:');
  });
});
