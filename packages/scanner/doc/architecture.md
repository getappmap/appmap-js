## Scanner architecture

See [@appland/models source code](https://github.com/applandinc/appmap-js/tree/main/packages/models) for the JS API to AppMap data.

## Assertions

An Assertion tests each configured AppMap event to see if it matches some condition.

If there is a match, the assertion returns a Finding. A Finding contains the type of check, the event, and a descriptive message. Supporting (related) events may also be reported.

## Strategies

Each Check declares a Strategy that is used to iterate over the AppMap data. In a common case, the Strategy selects events by type: for example `http_server_request`, `sql_query`, or `function`.

The event match condition can be further refined by the Assertion, using `where`, `include` and `exclude` filter conditions. Events must match the `where` and `include` conditions, and must not match the `exclude` condition. The `where` condition is built into the Assertion. The `inculde` and `exclude` conditions are blank, and exist to be customized by the user.

## Examples

### HTTP 500

`http-500` assertion is a simple example. It specifies the `http_server_request` strategy - so each HTTP server request Event is passed into the assertion `matcher` function.

The `where` condition filter out events that don't have an `http_server_response` - for example, if the server process was hard-killed in the middle of processing.

The `matcher` function returns true if the HTTP status code is between 500 and 599.

### Insecure compare

`insecure-compare` employs the `function` strategy - it asserts on every function call Event.

The `where` clause further selects events that are labeled `string.equals` or `secret`. The `secret` label is used to store a Set of all the secrets that are generated/returned by function events in the AppMap. When a `string.equals` function is encountered, the assertion returns true if:

1. The function has a receiver value and one parameter.
2. Both the receiver value and the parameter value are not BCrypted-strings.
3. Both the receiver value and the parameter value are either (a) a known secret or (b) match a secret regexp
