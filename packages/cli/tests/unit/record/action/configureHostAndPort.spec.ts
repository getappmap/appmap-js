import sinon from 'sinon';

import * as configuration from '../../../../src/cmds/record/configuration';
import UI from '../../../../src/cmds/userInteraction';
import configureHostAndPort from '../../../../src/cmds/record/action/configureHostAndPort';
import TempConfig from '../tempConfig';

describe('record.configureHostAndPort', () => {
  let config: TempConfig;
  let prompt: sinon.SinonStub;

  beforeEach(() => (config = new TempConfig()));
  beforeEach(() => config.initialize());
  beforeEach(() => (prompt = sinon.stub(UI, 'prompt')));

  afterEach(() => config.cleanup());
  afterEach(() => sinon.restore());

  it('accepts and saves host and port', async () => {
    prompt.onCall(0).resolves({ hostname: 'myhost' });
    prompt.onCall(1).resolves({ portNumber: '3000' });

    await configureHostAndPort();

    const ro = await configuration.requestOptions();

    expect(ro.hostname).toEqual('myhost');
    expect(ro.port).toEqual(3000);
  });

  it('re-prompts for malformed port', async () => {
    prompt.onCall(0).resolves({ hostname: 'myhost' });
    prompt.onCall(1).resolves({ portNumber: 'blarg' });
    prompt.onCall(2).resolves({ portNumber: '3000' });

    await configureHostAndPort();

    const ro = await configuration.requestOptions();
    expect(ro.hostname).toEqual('myhost');
    expect(ro.port).toEqual(3000);
  });
});
