/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import sinon, { SinonSpy } from 'sinon';
import Conf from 'conf';
import Telemetry, {
  EnvironmentSession,
  Git,
  GitState,
  TelemetrySession,
  getMachineId,
  getSession,
} from './telemetry';
import { name as appName, version } from './package.json';
import child_process, { ChildProcess } from 'node:child_process';
import { nextTick } from 'node:process';
import { Contracts } from 'applicationinsights';
import assert from 'node:assert';
import { SinonStub } from 'sinon';

const invalidExpiration = () => Date.now() - 1000 * 60 * 60;

describe('telemetry', () => {
  const sandbox = sinon.createSandbox();
  let confMemory: Record<string, unknown> = {};
  let trackEvent: sinon.SinonStub<[Contracts.EventTelemetry]>;
  beforeEach(() => {
    // Don't accidentally send data
    sandbox.stub(Telemetry, 'client').value({
      trackEvent: (trackEvent = sandbox.stub()),
      flush: sandbox.stub(),
    });

    // Don't persist data locally
    // We have to cast to the correct type because the stub is not typed correctly
    // according to the implementation. It's using the first overload.
    const setStub = sandbox.stub(Conf.prototype, 'set');
    const setStubOverload = setStub as unknown as SinonStub<[string, unknown], void>;
    setStubOverload.callsFake((key: string, value: unknown): void => {
      confMemory[key] = value;
    });

    sandbox.stub(Conf.prototype, 'get').callsFake((key: string): unknown => {
      return confMemory[key];
    });
  });

  afterEach(() => {
    sandbox.restore();
    confMemory = {};
  });

  describe('TelemetrySession', () => {
    it('writes persistent session data', () => {
      const session = new TelemetrySession();

      // The session id will be generated on first access, so we need to access it
      // before we can check it against what is persisted.
      const { id } = session;
      expect(confMemory.sessionId).toBe(id);
      expect(confMemory.sessionExpiration).toBe(session['expiration']);
    });

    it('reads persistent session data', () => {
      const sessionId = 'sessionId';
      const sessionExpiration = Date.now() + 1000;
      confMemory = { sessionId, sessionExpiration };

      const session = new TelemetrySession();
      expect(session['sessionId']).toBe(sessionId);
      expect(session['expiration']).toBe(sessionExpiration);
    });

    it('issues a new session once an existing session has expired', () => {
      const session = new TelemetrySession();
      const firstSessionId = session.id;

      session['expiration'] = invalidExpiration();

      expect(session.id).not.toBe(firstSessionId);
      expect(session['expiration']).toBeGreaterThan(Date.now());
    });

    it('updates the expiration when the session is touched', async () => {
      const session = new TelemetrySession();
      const sessionId = session.id;
      const sessionExpiration = session['expiration'];

      // Guarantee the session expiration should change once the session is updated
      await new Promise((r) => setTimeout(r, 16));

      session.touch();

      // The session expiration should have been updated
      expect(sessionExpiration).not.toBe(session['expiration']);
      expect(sessionExpiration).toBeLessThan(session['expiration'] || 0);

      // The session identifier should remain the same
      expect(session.id).toBe(sessionId);
    });

    it('touching an expired session does nothing', () => {
      const session = new TelemetrySession();
      const expired = invalidExpiration();
      const sessionId = session.id;

      session['expiration'] = expired;
      session.touch();

      // The session remains expired as it's not possible to update a dead session
      expect(session['expiration']).toBe(expired);

      // The session identifer is updated upon request
      expect(session.id).not.toBe(sessionId);
    });
  });

  describe('getMachineId', () => {
    it('reflects APPMAP_USER_ID if set', () => {
      const userId = 'test';
      sandbox.stub(process, 'env').value({ APPMAP_USER_ID: userId });
      expect(getMachineId()).toBe(userId);
    });

    it('returns a value if APPMAP_USER_ID is not set', () => {
      sandbox.stub(process, 'env').value({ APPMAP_USER_ID: undefined });
      expect(getMachineId()).toBeTruthy();
    });
  });

  describe('EnvironmentSession', () => {
    it('reflects the value of APPMAP_SESSION_ID', () => {
      const sessionId = 'test';
      sandbox.stub(process, 'env').value({ APPMAP_SESSION_ID: sessionId });
      const session = new EnvironmentSession();
      expect(session.id).toBe(sessionId);
    });

    it('raises an error if APPMAP_SESSION_ID is not set', () => {
      sandbox.stub(process, 'env').value({ APPMAP_SESSION_ID: undefined });
      expect(() => new EnvironmentSession()).toThrowError();
    });

    it('is not persisted', () => {
      sandbox.stub(process, 'env').value({ APPMAP_SESSION_ID: 'test' });
      const session = new EnvironmentSession();
      expect(session.id).toBeDefined();
      expect(confMemory.sessionId).toBeUndefined();
    });
  });

  describe('getSession', () => {
    it('returns an environment session when APPMAP_SESSION_ID is present', () => {
      sandbox.stub(process, 'env').value({ APPMAP_SESSION_ID: 'test' });
      const session = getSession();
      expect(session).toBeInstanceOf(EnvironmentSession);
    });

    it('returns a telemetry session when APPMAP_SESSION_ID is not present', () => {
      sandbox.stub(process, 'env').value({ APPMAP_SESSION_ID: undefined });
      const session = getSession();
      expect(session).toBeInstanceOf(TelemetrySession);
    });

    it('returns a telemetry session when APPMAP_SESSION_ID is empty', () => {
      sandbox.stub(process, 'env').value({ APPMAP_SESSION_ID: '' });
      const session = getSession();
      expect(session).toBeInstanceOf(TelemetrySession);
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

    it('does not transform qualified keys', () => {
      Telemetry.sendEvent({
        name: 'test event',
        properties: {
          'qualified.test.property': 'test value',
        },
      });
      const [[{ properties }]] = trackEvent.args;
      assert(properties);
      expect(properties['qualified.test.property']).toEqual('test value');
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

    describe('state', () => {
      it('returns NotInstalled on error', () => {
        jest.spyOn(child_process, 'spawn').mockImplementation(() => {
          const cp = new ChildProcess();
          nextTick(() => cp.emit('error', new Error('test error')));
          return cp;
        });

        return expect(Git.state()).resolves.toEqual(GitState.NotInstalled);
      });
    });
  });
});
