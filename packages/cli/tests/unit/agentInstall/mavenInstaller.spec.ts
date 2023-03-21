import path from 'path';
import { promises as fs } from 'fs';
import { glob as globCallback } from 'glob';
import { promisify } from 'util';
import sinon from 'sinon';
import MavenInstaller from '../../../src/cmds/agentInstaller/mavenInstaller';
import EncodedFile from '../../../src/encodedFile';
import InstallerUI from '../../../src/cmds/agentInstaller/installerUI';

const glob = promisify(globCallback);
const fixtureDir = path.join(__dirname, '..', 'fixtures', 'java', 'maven');
const interactiveUI = new InstallerUI(true, {});

describe('MavenInstaller', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('available', () => {
    it('detects a maven project', () => {
      const projectDirectory = path.join(fixtureDir, 'example-project');
      const maven = new MavenInstaller(projectDirectory);
      expect(maven.available()).resolves.toBe(true);
    });
  });

  describe('installAgent', () => {
    it('transforms pom.xml as expected', async () => {
      const dataDir = path.join(fixtureDir, 'data');
      const maven = new MavenInstaller('.');
      const expectedExt = '.expected.xml';
      const files = await glob(path.join(dataDir, `*${expectedExt}`));
      const tests = files.map((file) => path.basename(file, expectedExt));
      const efWrite = sinon.stub(EncodedFile.prototype, 'write');

      for (let i = 0; i < tests.length; ++i) {
        const test = tests[i];
        sinon.stub(maven, 'buildFilePath').value(path.join(dataDir, `${test}.actual.xml`));

        const expected = (await fs.readFile(path.join(dataDir, `${test}${expectedExt}`)))
          .toString()
          .replace(/\s+/g, ' ');

        await maven.installAgent(interactiveUI);

        const actual = efWrite.getCall(-1).args[0].replace(/\s+/g, ' ');
        expect(actual).toBe(expected);
      }
    });

    it('fails when installing to an empty project', async () => {
      const maven = new MavenInstaller('.');
      sinon
        .stub(EncodedFile, 'read')
        .withArgs(maven.buildFilePath)
        .returns({
          buf: Buffer.from('<!-- This file intentionally (mostly) empty -->'),
          bom0: undefined,
          bom1: undefined,
          encoding: undefined,
        });

      expect(maven.installAgent(interactiveUI)).rejects.toThrow(/No project section found/);
    });
  });
});
