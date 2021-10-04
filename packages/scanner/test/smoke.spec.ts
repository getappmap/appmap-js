import { join } from 'path';
import sinon from 'sinon';
import AssertCommand from '../src/command';
import { fixtureAppMap } from './util';

describe('smoke test', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('runs as expected with JS config', async () => {
    sinon.stub(process.stdout, 'write');
    const processExit = sinon.stub(process, 'exit');
    await AssertCommand.handler({
      appmapFile: fixtureAppMap(
        'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
      ),
      format: 'progress',
      config: join(__dirname, '..', 'src', 'sampleConfig', 'default.ts'), // need to pass it explicitly
    } as any);

    expect(processExit.calledWith(0)).toBe(true);
  });

  it('runs as expected with YAML config', async () => {
    sinon.stub(process.stdout, 'write');
    const processExit = sinon.stub(process, 'exit');
    await AssertCommand.handler({
      appmapFile: fixtureAppMap(
        'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
      ),
      format: 'progress',
      config: join(__dirname, '..', 'src', 'sampleConfig', 'default.yml'), // need to pass it explicitly
    } as any);

    expect(processExit.calledWith(0)).toBe(true);
  });
});
