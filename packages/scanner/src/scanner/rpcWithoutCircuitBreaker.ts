import { Event, EventNavigator } from '@appland/models';
import { AssertionSpec } from 'src/types';
import * as types from './types';
import Assertion from '../assertion';
import { RPCWithoutProtectionOptions, rpcWithoutProtection } from './lib/rpcWithoutProtection';

class Options implements RPCWithoutProtectionOptions, types.RPCWithoutCircuitBreaker.Options {
  public expectedLabel: string = RPCCircuitBreaker;
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

const RPCCircuitBreaker = 'rpc.circuit_breaker';

export default {
  Options,
  Labels: [RPCCircuitBreaker],
  enumerateScope: true,
  scanner,
} as AssertionSpec;
