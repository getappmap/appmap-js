---
rule: unfulfilled-promise
name: Unfulfilled promise
title: Unfulfilled Promise
---

Finds promises which have been created during the recording but have remained unfulfilled at the
end.

### Rule logic

The rule simply looks for return events with value of `Promise { <pending> }` without a subsequent
update.

### Notes

`Promise { <pending> }` is a special value used by the appmap-node agent to represent promises that
haven't been fulfilled yet. Normally, once the promise is fulfilled, an event update is added to the
AppMap with the resolved value and total elapsed run time.

However, if a promise remains unfulfilled when the recording ends (for example when a HTTP response
is sent or a test case finishes) this pending state is never updated.

Most of the time it means some asynchronous computation has been started and its results not awaited
for and therefore not collected; such computations should be removed or the results awaited.

In some cases this is an intended behaviour; for example, a background book-keeping or cleanup
process might be started which doesn't directly impact the results of the operation that triggered
it. Note that during testing such processes should still run to completion before a test case
finishes (or else be suppressed altogether); otherwise there might be unintended interference
between test cases leading to brittle tests. Each test case should start from a known, clean and
quiescent environment.

### Resolution

Identify where the promise is created and make sure to `await` on it. Even when the result is void,
some other part of the program might assume the asynchronous computation has completed. Without
awaiting it at that point a race condition can result, leading to intermittent stability issues.

### Options

None

### Examples

```yaml
- rule: unfulfilledPromise
```
