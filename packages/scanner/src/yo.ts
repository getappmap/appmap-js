import Check from './check';
import rule from './rules/rpcWithoutCircuitBreaker';
import { scan } from '../test/util';

scan(
  new Check(rule),
  'Test_net_5xxs_trip_circuit_when_fatal_server_flag_enabled.appmap.json'
).then(() => {
  console.log("done");
});
