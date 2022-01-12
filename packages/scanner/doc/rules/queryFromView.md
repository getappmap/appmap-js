---
title: Query from view
id: query-from-view
---

Ensures that SQL queries are not performed directly from the view layer. This helps to make the code
more maintainable by encapsulating access to the database.

### Notes

Performing SQL queries directly from the view layer introduces several maintainability concerns:

1. View logic is tied to the server, and cannot be refactored to the client side.
2. Database interactions are harder to test, because they depend on details of the view
   implementation.
3. Performance can be adversely and unexpectedly affected by minor changes to the view.

### Rule logic

Each query is tested to see if it has an ancestor event with the view label.

### Resolution

Data objects which are passed to the view layer for rendering should not have access to the
database. Disable database access in some way, or transfer data from DAO objects into plain old
structs.

### Options

- `forbiddenLabel`. Label which identifies the view layer. Default: `mvc.template`.

### Examples

```yaml
- rule: queryFromView
  properties:
    forbiddenLabel: mvc.template
```
