---
title: Save without validation
id: save-without-validation
---

Ensures that data saved by data access object is validated first.

### Rule logic

Finds events whose method name is `save` or `save!`. Then verifies that each of these events has a
descendant whose method name is `valid?` or `validate!`.

### Notes

In a future revision, this rule will be refactored to use labels rather than method names.

### Resolution

Ensure that data is validated before being saved; for example, using a `before_save` hook.

### Options

None

### Examples

```yaml
- rule: saveWithoutValidation
```
