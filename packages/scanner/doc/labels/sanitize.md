---
name: sanitize
rules:
  - deserialization-of-untrusted-data
---

Ensures that data is safe and trusted, transforming it if necessary, and returning `falsey` or
raising an exception if it's impossible to make the data safe.

A function with this label can be used to convert untrusted data such as direct user input or HTTP
request parameters into trusted data.

Note that this is not the same as ensuring that a parameter satisfies business logic constraints -
such as presence or max length. It's a security check that ensures the data cannot cause downstream
harm.

To be considered successful, a `sanitize` function must return a `truthy` value.

## Examples

- Sanitizing HTML by removing all potentially harmful elements, such as script tags.
- Ensuring that SQL queries are properly escaped.
- Running user-provided YAML through a "safe loader" which discards unsafe syntax such as object
  class names.
- Ensuring that a user-provided file path is a subdirectory of a known allowed directory.
- Ensuring that a system command string does not have any potential injection or side-effects.
- Ruby -
  [sanitize_filename](https://github.com/technoweenie/attachment_fu/blob/fa08cb03914b02b66853b4615cd3eca768291ca7/lib/technoweenie/attachment_fu.rb#L410)
  in `attachment_fu`.
