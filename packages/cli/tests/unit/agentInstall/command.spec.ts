import path from 'path';
import fs from 'fs-extra';
import tmp from 'tmp';
import sinon from 'sinon';
import inquirer from 'inquirer';
import { handler as invokeCli } from '../../../src/cmds/agentInstaller/install-agent';

const fixtureDir = path.join(__dirname, '..', 'fixtures', 'java');
tmp.setGracefulCleanup();

describe('install-agent sub-command', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('installs a gradle project as expected', async () => {
    const projectFixture = path.join(fixtureDir, 'gradle', 'example-project');
    const projectDir = tmp.dirSync({} as any).name;

    fs.copySync(projectFixture, projectDir);

    sinon.stub(inquirer, 'prompt').resolves({ addMavenCentral: 'Yes' });

    await invokeCli({ projectType: 'gradle', dir: projectDir });

    const updatedConfig = await fs.readFile(
      path.join(projectDir, 'build.gradle'),
      { encoding: 'utf-8' }
    );

    const expectedConfig = await fs.readFile(
      path.join(projectDir, 'build.expected.gradle'),
      { encoding: 'utf-8' }
    );

    expect(updatedConfig).toBe(expectedConfig);

    const appmapConfig = await fs.readFile(
      path.join(projectDir, 'appmap.yml'),
      { encoding: 'utf-8' }
    );

    expect(appmapConfig).toContain(path.basename(projectDir));
    expect(appmapConfig).toMatch(/This is the AppMap configuration file/);
    expect(appmapConfig).toMatch(/- path: com.example/);
  });
});
