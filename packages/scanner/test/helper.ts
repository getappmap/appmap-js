import sinon from 'sinon';
import extend from 'sinon/lib/sinon/util/core/extend';
import Telemetry from '../src/telemetry';

export function withSandbox(): sinon.SinonSandbox {
  // The sinon doc says the default export is a sandbox, but it actually isn't (which is what this
  // issue is getting at https://github.com/sinonjs/sinon/issues/1795). It's really a sandbox with
  // some more methods added in:
  const api = sinon.createSandbox();
  extend(api, sinon);

  return api;
}
export function withStubbedTelemetry(sandbox: sinon.SinonSandbox = sinon): void {
  beforeEach(() => {
    // Stub all Telemetry methods. flush still needs to work, though.
    sandbox.stub(Telemetry);
    const callCB = (cb: (...args: unknown[]) => unknown) => {
      return cb();
    };
    (Telemetry.flush as sinon.SinonStub).callsFake(callCB);
  });

  afterEach(() => {
    // This bug https://github.com/sinonjs/sinon/issues/2384 acknowledges that
    // sinon.restore doesn't restore static methods. It suggests
    // sinon.restoreObject as a workaround, but restoreObject is currently
    // missing from @types/sinon.
    //
    // This hacks around both problems:

    // sandbox['restoreObject'](Telemetry);
    (sandbox as unknown as { restoreObject(tm: Telemetry): void })['restoreObject'](Telemetry);
    sandbox.restore();
  });
}
