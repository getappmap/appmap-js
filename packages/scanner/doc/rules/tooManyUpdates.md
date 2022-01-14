---
id: too-many-updates
name: Too many updates
title: Too many SQL and RPC updates performed in one command
impactDomain: Maintainability
scope: command
---

Verifies that the number of SQL and RPC updates performed by a command does not exceed a threshold.

### Rule logic

Counts the number of SQL and RPC updates in each command. A SQL update is any `INSERT` or `UPDATE`
query. An RPC update is an HTTP client request that uses `PUT`, `POST`, or `PATCH`.

If the number of updates exceeds the threshold, a finding is reported.

### Notes

As a codebase evolves, sometimes a request can start to make more and more SQL and RPC updates.There
are several negative repercussions of this:

1. It's no longer clear to a developer what the primary responsibility of the command is.
2. The command becomes more likely to fail - resulting in a rollback of all the updates, or possibly
   leaving the system in an inconsistent state.
3. The performance of the command degrades as it does more and more work.

### Resolution

Consider refactoring the command into multiple commands.

Schedule a job to perform some of the work offline.

### Options

- `warningLimit` the maximum number of joins allowed.

### Examples

```yaml
- rule: tooManyUpdates
  properties:
    warningLimit: 20
```
