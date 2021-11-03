import { Event, EventNavigator, Label } from '@appland/models';
import { AssertionSpec } from 'src/types';
import Assertion from '../assertion';
import { RPCWithoutProtectionOptions, rpcWithoutProtection } from './lib/rpcWithoutProtection';

class Options implements RPCWithoutProtectionOptions {
  constructor(public circuitBreakerLabel: Label = 'rpc.circuit_breaker') {}

  get whitelistLabel(): Label {
    return this.circuitBreakerLabel;
  }
}

// The circuit breaker will be found in a descendant of the httpClientRequest.
function* descendants(httpClientRequest: Event): Generator<Event> {
  for (const candidate of new EventNavigator(httpClientRequest).descendants()) {
    yield candidate.event;
  }
}

function scanner(options: Options = new Options()): Assertion {
  return rpcWithoutProtection(
    'rpc-without-circuit-breaker',
    'RPC without circuit breaker',
    descendants,
    options
  );
}

export default { Options, scanner } as AssertionSpec;
