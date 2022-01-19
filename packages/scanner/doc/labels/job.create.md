---
name: job.create
rules:
  - job-not-cancelled
---

Schedules a background job for execution. Background jobs run in a separate thread or process from
the web application request - therefore they do not block the response.

## Examples

- Ruby
  [ActiveJob::Enqueuing#enqueue](https://api.rubyonrails.org/classes/ActiveJob/Enqueuing.html#method-i-enqueue)
