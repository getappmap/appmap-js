---
id: update-in-get-request
name: Update in get request
title: Data update performed in GET or HEAD request
impactDomain: Maintainability
labels:
  - audit
---

Finds SQL updates that are performed in an HTTP server `GET` request.

### Rule logic

Checks each HTTP server `GET` and `HEAD` request. Within each of these requests, checks for SQL
queries that match the `queryInclude` option and don't match `queryExclude`. If any such queries
exist, they are emitted as findings.

### Notes

Performing data updates in a `GET` request is anti-pattern, and counter to the intent of HTTP. For
data modifications, use `PUT`, `POST`, or `PATCH`.

Data updates which are used for the purposes of tracking user activity are fine in any type of
request. Use the `queryExclude` option to allow these queries.

### Resolution

Perform data updates in `PUT`, `POST`, or `PATCH` requests.

### Options

- `queryInclude: RegExp[]`. Default: `[/\binsert\b/i, /\bupdate\b/i]`.
- `queryExclude: RegExp[]`. Default: empty.

### Examples

```yaml
- rule: updateInGetRequest
  properties:
    queryExclude:
      - /\bINSERT\b/i
      - /\bUPDATE\b/i
```
