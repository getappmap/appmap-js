import { Event, EventNavigator } from '@appland/models';
import * as types from './types';
import { RPCWithoutProtectionOptions, rpcWithoutProtection } from './lib/rpcWithoutProtection';
import { Rule, RuleLogic } from 'src/types';

class Options implements RPCWithoutProtectionOptions, types.RPCWithoutCircuitBreaker.Options {
  public expectedLabel: string = RPCCircuitBreaker;
}

// The circuit breaker will be found in a descendant of the httpClientRequest.
function* descendants(httpClientRequest: Event): Generator<Event> {
  for (const candidate of new EventNavigator(httpClientRequest).descendants()) {
    yield candidate.event;
  }
}

function build(options: Options = new Options()): RuleLogic {
  return rpcWithoutProtection(descendants, options);
}

const RPCCircuitBreaker = 'rpc.circuit_breaker';

export default {
  id: 'rpc-without-circuit-breaker',
  title: 'RPC without circuit breaker',
  Options,
  labels: [RPCCircuitBreaker],
  impactDomain: 'Stability',
  enumerateScope: true,
  build,
} as Rule;
