---
name: string.equals
rules:
  - insecure-compare
---

Compares two strings for equality.

The function receiver should be a string, and the function should take one argument that is the
other string.

Returns `truthy` if the strings are equal; otherwise `falsey`.

## Examples

- Ruby [String#==](https://ruby-doc.org/core-3.1.0/String.html#method-i-3D-3D)
- Java
  [String#equals](<https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/String.html#equals(java.lang.Object)>)
