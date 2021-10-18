import { join } from 'path';
import sinon from 'sinon';
import Scanner from '../src/command';
import { fixtureAppMap } from './util';
import { readFileSync, unlinkSync } from 'fs';

describe('smoke test', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('runs as expected with YAML config', async () => {
    sinon.stub(process.stdout, 'write');
    const processExit = sinon.stub(process, 'exit');
    await Scanner.handler({
      appmapFile: fixtureAppMap(
        'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
      ),
      format: 'progress',
      config: join(__dirname, '..', 'src', 'sampleConfig', 'default.yml'), // need to pass it explicitly
    } as any);

    expect(processExit.calledWith(0)).toBe(true);
  });

  it('generates JSON report', async () => {
    sinon.stub(process.stdout, 'write');
    const processExit = sinon.stub(process, 'exit');
    const reportFile = 'report.json';
    await Scanner.handler({
      appmapFile: fixtureAppMap(
        'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
      ),
      format: 'progress',
      config: join(__dirname, '..', 'src', 'sampleConfig', 'default.yml'), // need to pass it explicitly
      reportFormat: 'json',
      reportFile: reportFile,
    } as any);

    expect(processExit.calledWith(0)).toBe(true);
    expect(JSON.parse(readFileSync(reportFile).toString())).toEqual([]);
    unlinkSync(reportFile);
  });
});
