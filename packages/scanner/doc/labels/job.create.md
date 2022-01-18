---
name: job.create
rules:
  - job-not-cancelled
---

Indicates that a scheduled background job is being created.

## Examples

- Ruby
  [ActiveJob::Enqueuing#enqueue](https://api.rubyonrails.org/classes/ActiveJob/Enqueuing.html#method-i-enqueue)
