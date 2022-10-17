import * as jbs from '../../../src/cmds/agentInstaller/jetBrainsSupport';
import { addJetBrainsEnv } from '../../../src/cmds/agentInstaller/javaBuildToolInstaller';
import sinon from 'sinon';
import path from 'path';

describe('JavaBuildToolInstaller', () => {
  let origPath: string | undefined, origJavaHome: string | undefined;
  beforeEach(() => {
    origPath = process.env.PATH;
    origJavaHome = process.env.JAVA_HOME;
  });

  afterEach(() => {
    sinon.restore();
    process.env.PATH = origPath;
    process.env.JAVA_HOME = origJavaHome;
  });

  describe('when IntelliJ is installed', () => {
    const intellijHome = path.join('/', 'IntelliJ');
    beforeEach(() => {
      sinon.stub(jbs, 'findIntelliJHome').returns(intellijHome);
    });

    it('appends JetBrains JDK to PATH', () => {
      addJetBrainsEnv();
      expect(process.env.PATH).toContain(path.join(intellijHome, 'jbr', 'bin'));
    });

    it('sets JAVA_HOME if unset', () => {
      delete process.env.JAVA_HOME;
      addJetBrainsEnv();
      const expectedIntellijHome = path.join(intellijHome, 'jbr');
      expect(process.env.JAVA_HOME).toBe(expectedIntellijHome);
    });

    it('uses JAVA_HOME if set', () => {
      process.env.JAVA_HOME = '/JDK';
      addJetBrainsEnv();
      expect(process.env.JAVA_HOME).toBe('/JDK');
    });
  });

  describe('when IntelliJ is not installed', () => {
    beforeEach(() => {
      sinon.stub(jbs, 'findIntelliJHome').returns(undefined);
    });

    it("doesn't update PATH", () => {
      addJetBrainsEnv();
      expect(process.env.PATH).toBe(origPath);
    });

    it("doesn't set JAVA_HOME", () => {
      addJetBrainsEnv();
      expect(process.env.JAVA_HOME).toBe(origJavaHome);
    });
  });
});
