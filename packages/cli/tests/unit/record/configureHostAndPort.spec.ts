import sinon from 'sinon';
import * as configuration from '../../../src/cmds/record/configuration';
import UI from '../../../src/cmds/userInteraction';
import configureHostAndPort from '../../../src/cmds/record/configureHostAndPort';
import { RequestOptions } from 'https';

describe('record.configureHostAndPort', () => {
  let readSetting: sinon.SinonStub,
    writeSetting: sinon.SinonStub,
    prompt: sinon.SinonStub,
    options: RequestOptions;

  beforeEach(() => {
    readSetting = sinon.stub(configuration, 'readSetting');
    writeSetting = sinon.stub(configuration, 'writeSetting');
    options = {} as RequestOptions;
    prompt = sinon.stub(UI, 'prompt');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('accepts and saves host and port', async () => {
    prompt.onCall(0).resolves({ hostname: 'myhost' });
    prompt.onCall(1).resolves({ portNumber: '3000' });

    readSetting.withArgs('dev_server.host', 'localhost').resolves('myhost');
    readSetting.withArgs('dev_server.port', 3000).resolves(3000);

    await configureHostAndPort(options);

    expect(options.hostname).toEqual('myhost');
    expect(options.port).toEqual(3000);

    expect(
      writeSetting.calledWithExactly('dev_server.host', 'myhost')
    ).toBeTruthy();
    expect(
      writeSetting.calledWithExactly('dev_server.port', 3000)
    ).toBeTruthy();
  });

  it('re-prompts for malformed port', async () => {
    prompt.onCall(0).resolves({ hostname: 'myhost' });
    prompt.onCall(1).resolves({ portNumber: 'blarg' });
    prompt.onCall(2).resolves({ portNumber: '3000' });

    readSetting.withArgs('dev_server.host', 'localhost').resolves('myhost');
    readSetting.withArgs('dev_server.port', 3000).resolves(3000);

    await configureHostAndPort(options);

    expect(options.hostname).toEqual('myhost');
    expect(options.port).toEqual(3000);
  });
});
