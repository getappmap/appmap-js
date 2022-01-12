---
title: RPC without circuit breaker
id: rpc-without-circuit-breaker
---

Identifies HTTP client requests which do not utilize a
[circuit breaker](https://martinfowler.com/bliki/CircuitBreaker.html).

### Rule logic

Each HTTP client request is expected to have a descendant labeled with the expected label.

### Notes

Use the circuit breaker pattern in microservices architecture to make system behavior more
predictable when a service becomes overloaded or unavailable.

### Resolution

Utilize a circuit breaker library - your organization may have a specific preference.

Some examples:

- [Hystrix (Java)](https://github.com/Netflix/Hystrix/wiki/How-it-Works#CircuitBreaker)
- [CircuitBox (Ruby)](https://github.com/yammer/circuitbox)
- [Semian (Ruby)](https://github.com/Shopify/semian#circuit-breaker)
- [pybreaker (Python)](https://github.com/danielfm/pybreaker)

### Options

- `expectedLabel`. Label which identifies the circuit breaker function. Default:
  `rpc.circuit_breaker`.

### Examples

```yaml
- rule: rpcWithoutCircuitBreaker
  properties:
    expectedLabel: rpc.circuit_breaker
```
