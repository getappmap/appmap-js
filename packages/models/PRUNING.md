Pruning works by finding the most repetitive calls within a given "chunk" and
removing events associated with those calls. A chunk is defined as a group of
logic, consisting of one or more full call stacks. Boundaries of these chunks
are created around application entrypoints such as inbound HTTP request.

An example list of chunks is provided below:
```
HTTP request - GET /user
Background thread processing
HTTP request - PUT /user
Background thread processing
HTTP request - GET /
```

For each chunk, aggregate the total number of unique events. Starting from the
most repetitive event type, remove instances of that event until the size of the
chunk (in byte) is less than:
```
requested size / total event array size * starting chunk size
```

In essence, we're calculating a unique exclusion list for each chunk. This
prevents an excessively noisy or repetitive call stack in one area of execution
from affecting the results of unrelated areas of execution.

Non-application events such as HTTP requests and SQL queries will always be
retained. This means that the end result can never be smaller than the total
size of these events combined.
