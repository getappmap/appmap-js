import * as jbs from '../../../src/cmds/agentInstaller/jetBrainsSupport';
import { addJetBrainsEnv } from '../../../src/cmds/agentInstaller/javaBuildToolInstaller';
import sinon from 'sinon';

describe('JavaBuildToolInstaller', () => {
  let origPath, origJavaHome;
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
    const intellijHome = '/IntelliJ';
    beforeEach(() => {
      sinon.stub(jbs, 'findIntelliJHome').returns(intellijHome);
    });

    it('appends JetBrains JDK to PATH', () => {
      addJetBrainsEnv();
      expect(process.env.PATH).toMatch(/\/IntelliJ\/jbr\/bin/);
    });

    it('sets JAVA_HOME if unset', () => {
      delete process.env.JAVA_HOME;
      addJetBrainsEnv();
      expect(process.env.JAVA_HOME).toBe(intellijHome + '/jbr');
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
