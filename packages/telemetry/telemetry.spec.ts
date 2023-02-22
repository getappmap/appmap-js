/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import sinon, { SinonSpy } from 'sinon';
import Conf from 'conf';
import Telemetry, { Git } from './telemetry';
import { name as appName, version } from './package.json';

const invalidExpiration = () => Date.now() - 1000 * 60 * 60;

describe('telemetry', () => {
  const sandbox = sinon.createSandbox();
  let trackEvent: sinon.SinonStub;
  beforeEach(() => {
    // Don't accidentally send data
    sandbox.stub(Telemetry, 'client').value({
      trackEvent: (trackEvent = sandbox.stub()),
      flush: sandbox.stub(),
    });

    // Don't persist data locally
    sandbox.stub(Conf.prototype, 'set');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Session', () => {
    it('writes persistent session data', () => {
      // Ignore any existing sessions.
      const conf = sandbox.stub(Conf.prototype, 'get');
      conf.withArgs(sinon.match('sessionId')).returns(undefined);

      const setStub = Conf.prototype['set'] as SinonSpy;
      const { session } = Telemetry;

      expect(setStub.getCall(-2).args[1]).toBe(session.id);
      expect(setStub.getCall(-1).args[1]).toBe(session.expiration);
    });

    it('reads persistent session data', () => {
      const expiration = Date.now() + 1000;
      const conf = sandbox.stub(Conf.prototype, 'get');
      conf.withArgs(sinon.match('sessionId')).returns('sessionId');
      conf.withArgs(sinon.match('sessionExpiration')).returns(expiration);

      // Force a new session
      Telemetry.session.expiration = invalidExpiration();

      const { session } = Telemetry;
      expect(session.id).toBe('sessionId');
      expect(session.expiration).toBe(expiration);
    });

    it('issues a new session once an existing session has expired', () => {
      const conf = sandbox.stub(Conf.prototype, 'get');
      conf.withArgs(sinon.match('sessionId')).returns(undefined);
      const firstSession = Telemetry.session;
      const firstSessionId = firstSession.id;

      expect(firstSession.valid).toBe(true);
      sandbox.stub(firstSession, 'expiration').value(invalidExpiration());
      expect(firstSession.valid).toBe(false);

      const secondSession = Telemetry.session;
      expect(firstSession).not.toBe(secondSession);
      expect(secondSession.id).not.toBe(firstSessionId);
      expect(secondSession.valid).toBe(true);
      expect(secondSession.expiration).toBeGreaterThan(Date.now());
    });

    it('updates the expiration when the session is touched', async () => {
      const { session } = Telemetry;
      const sessionExpiration = session.expiration;

      // Guarantee the session expiration should change once the telemetry is sent
      await new Promise((r) => setTimeout(r, 16));

      session.touch();

      expect(sessionExpiration).not.toBe(Telemetry.session.expiration); // session should have been updated
      expect(session).toBe(Telemetry.session); // session should be the same
    });
  });

  describe('Telemetry', () => {
    beforeEach(() => {
      sandbox.stub(Telemetry, 'enabled').get(() => true);
    });

    it('sends the expected telemetry data', () => {
      Telemetry.sendEvent({
        name: 'test',
        properties: { prop: 'value' },
        metrics: { metric: 1 },
      });

      const [[{ name, properties, measurements }]] = trackEvent.args;

      if (!properties) {
        throw new Error('properties not found');
      }
      if (!measurements) {
        throw new Error('measurements not found');
      }

      expect(trackEvent.calledOnce).toBe(true);
      expect(name).toBe(`${appName}/test`);
      expect(properties['common.source']).toBe(appName);
      expect(properties['common.os']).not.toHaveLength(0);
      expect(properties['common.platformversion']).not.toHaveLength(0);
      expect(properties['common.arch']).not.toHaveLength(0);
      expect(properties).not.toHaveProperty('common.environmentVariables');

      expect(properties['appland.telemetry.version']).toBe(version);
      expect(properties['appmap.cli.machineId']).toBe(Telemetry.machineId);
      expect(properties['appmap.cli.sessionId']).toBe(Telemetry.session.id);
      expect(typeof properties['appland.telemetry.args']).toBe('string');
      expect(properties['appland.telemetry.prop']).toBe('value');

      expect(measurements['appland.telemetry.metric']).toBe(1);
    });

    it('does not send undefined properties', () => {
      Telemetry.sendEvent({
        name: 'test',
        properties: { prop: undefined },
        metrics: { metric: undefined },
      });

      const [[{ properties, measurements }]] = trackEvent.args;

      if (!properties) {
        throw new Error('properties not found');
      }
      if (!measurements) {
        throw new Error('measurements not found');
      }

      expect(properties).not.toHaveProperty('appmap.cli.prop');
      expect(properties).not.toHaveProperty('appmap.cli.metric');
    });

    it('sends env var names upon request', () => {
      Telemetry.sendEvent(
        {
          name: 'test',
        },
        { includeEnvironment: true }
      );

      const [[{ properties }]] = trackEvent.args;

      if (!properties) {
        throw new Error('properties not found');
      }
      const envVars: string = properties['common.environmentVariables'];
      expect(envVars.split(',')).toBeInstanceOf(Array);
      expect(envVars).toMatch(/\bNODE_ENV\b/);
    });
  });

  describe('Git', () => {
    const sinceDaysAgo = 365;

    it('returns a list of unique git contributors', async () => {
      const contributors = await Git.contributors(sinceDaysAgo);
      expect(contributors.length).toBeGreaterThan(0);
    });

    it('properly caches the list of git contributors', async () => {
      let firstResult: string[] | undefined;
      for (let i = 0; i < 10; i++) {
        if (!firstResult) {
          firstResult = await Git.contributors(sinceDaysAgo);
        }

        expect(await Git.contributors(sinceDaysAgo)).toEqual(firstResult);
      }
    });
  });
});
