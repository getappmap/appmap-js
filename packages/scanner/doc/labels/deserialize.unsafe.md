---
name: deserialize.unsafe
rules:
  - deserialization-of-untrusted-data
---

## Examples

- Ruby [YAML.unsafe_load](https://docs.ruby-lang.org/en/3.0/Psych.html#method-c-unsafe_load)
- Ruby [Marshal.load](https://docs.ruby-lang.org/en/3.0/Marshal.html#method-c-load)
- Java
  [javax.jms.ObjectMessage#getObject)(https://docs.oracle.com/javaee/6/api/javax/jms/ObjectMessage.html#getObject())
