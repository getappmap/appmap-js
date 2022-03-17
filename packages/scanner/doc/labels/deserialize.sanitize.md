---
name: deserialize.sanitize
rules:
  - deserialization-of-untrusted-data
---

Ensures that data is safe and trusted for deserialization, transforming it if necessary, and
returning `falsey` or raising an exception if it's impossible to make the data safe.

A function with this label can be used to convert untrusted data such as direct user input or HTTP
request parameters into trusted data.

Note that this is not the same as ensuring that a parameter satisfies business logic constraints -
such as presence or max length. It's a security check that ensures the data cannot cause harm on
deserialization.

To be considered successful, a `deserialize.sanitize` function must return a `truthy` value.

## Examples

- Running user-provided YAML through a "safe loader" which discards unsafe syntax such as object
  class names.
