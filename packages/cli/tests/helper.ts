import sinon from 'sinon';
import extend from 'sinon/lib/sinon/util/core/extend';
import { Telemetry } from '@appland/telemetry';

export function withSandbox() {
  // The sinon doc says the default export is a sandbox, but it actually isn't (which is what this
  // issue is getting at https://github.com/sinonjs/sinon/issues/1795). It's really a sandbox with
  // some more methods added in:
  const api = sinon.createSandbox();
  extend(api, sinon);

  return api;
}

export function withStubbedTelemetry(sandbox: sinon.SinonSandbox = sinon) {
  beforeEach(() => {
    // Stub all Telemetry methods. flush still needs to work, though.
    sandbox.stub(Telemetry);
    const callCB = (cb) => {
      return cb();
    };
    (Telemetry.flush as sinon.SinonStub).callsFake(callCB);
  });

  afterEach(() => {
    sandbox.restore();
  });
}
