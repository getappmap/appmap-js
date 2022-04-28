---
name: dao.materialize
rules:
  - unbatched-materialized-query
---

Loads data access objects from the database into memory.

## Examples

- Ruby
  [ActiveRecord::Relation#records](https://github.com/rails/rails/blob/fa779b380e61381a393afbc7bbc0a9ce07e0ce74/activerecord/lib/active_record/relation.rb#L254)
