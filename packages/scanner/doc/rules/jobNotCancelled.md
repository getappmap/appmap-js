---
title: Job not canceled
id: job-not-canceled
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

This rule is designed for use with job queues that do not automatically roll back with the
transaction. If the job queue is the database and the same connection is used for the job queue and
for the request, then this scan is not needed.

If the job queue is stored externally, such as a message queue or Redis, then queued jobs will not
auto-cancel when the transaction is rolled back.

### Resolution

Cancel any queued jobs when the transaction rolls back.

### Options

None

### Examples

```yaml
- rule: jobNotCanceled
```
