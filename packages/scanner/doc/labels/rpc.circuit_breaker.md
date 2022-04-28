---
name: rpc.circuit_breaker
rules:
  - rpc-without-circuit-breaker
---

Indicates that a function provides
[circuit breaker](https://martinfowler.com/bliki/CircuitBreaker.html) functionality.

When present, a circuit breaker function is expected to be invoked as a descendant of an RPC client
request.

## Examples

- Ruby
  [Semian::CircuitBreaker#acquire](https://github.com/Shopify/semian/blob/master/lib/semian/circuit_breaker.rb#L26)
