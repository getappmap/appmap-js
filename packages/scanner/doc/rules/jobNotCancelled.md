---
rule: job-not-cancelled
name: Job not cancelled
title: Job created in a rolled back transaction and not cancelled
references:
  CWE-672: https://cwe.mitre.org/data/definitions/672.html
impactDomain: Stability
labels:
  - job.create
  - job.cancel
scope: transaction
---

Finds jobs which are created in a transaction, and not cancelled when the transaction is rolled
back.

### Rule logic

THe rule identifies SQL transaction boundaries by examining the SQL queries for `START TRANSACTION`,
`ROLLBACK`, `COMMIT`, etc.

Within each transaction, the rule looks for events labeled `job.create`. If the transaction is
rolled back, and there is not a corresponding event labeled `job.cancel`, then a finding is
reported.

### Notes

It's recommended to program delayed jobs defensively to check for data and silently do nothing if
that data is missing (eg. due to a rollback or a duplicate job); job details in this design are
stored in the database and the queue entries only reference them.

This rule is designed for use when this practice is impossible or not followed, and with external
job queues that do not automatically roll back with the transaction. If the job queue is the
database and the same connection is used for the job queue and for the request, then this check is
not needed.

### Resolution

Cancel any queued jobs when the transaction rolls back.

### Options

None

### Examples

```yaml
- rule: jobNotCanceled
```
