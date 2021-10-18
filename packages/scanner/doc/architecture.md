## Scanner architecture

See [@appland/models source code](https://github.com/applandinc/appmap-js/tree/main/packages/models) for the JS API to AppMap data.

## Assertions

An Assertion tests each configured AppMap event to see if it matches some condition. The test is applied by a `matcher` fnuction.

If there is a match, the assertion returns a Finding. A Finding contains the type of check, the event, and a descriptive message. Supporting (related) events may also be reported.

## Scopes

Each Assertion declares a Scope. The Scope is the set of events that will be checked by an instance of the Assertion object. An Assertion can use a narrower scope to help avoid giving false positives. For example, consider an Assertion that looks for "too many SQL queries". The Assertion only wants to count SQL queries within the Scope of a single command - not the entire AppMap.


Scope examples (roughly ordered from broadest to narrowest):

* `all` All events in the AppMap will be processed by the same Assertion instance.
* `root` A new Assertion instance is created for each root event.
* `command` A new Assertion instance is created for each HTTP server request, and for each event that is not a descendant of an HTTP server request AND has the label `command` or `job`.
* `http_server_request` A new Assertion instance is created for each HTTP server request.
* `transaction` A new Assertion instance is created for each database transaction in the AppMap.

## Event filters

Assertions use Event filters to choose which events are processed by the `matcher` function.

Event filters include the `where`, `include` and `exclude` conditions. Events must match the `where` and `include` conditions, and must not match the `exclude` condition. The `where` condition is built into the Assertion. The `include` and `exclude` conditions are blank, and exist to be customized by the user.

## Examples

### HTTP 500

`http-500` assertion is a simple example. It specifies the `http_server_request` scope - so that each HTTP server request is processed by a separate Assertion. 

The `where` condition filter out events that don't have an `http_server_response` - for example, if the server process was hard-killed in the middle of processing.

The `matcher` function returns true if the HTTP status code is between 500 and 599.

### Insecure compare

`insecure-compare` operates on the `all` scope - it looks for insecure compare across the entire AppMap.

The `where` clause selects events that are labeled `string.equals` or `secret`. The `secret` label is used to build a Set of all the secrets that are generated/returned by function events in the AppMap. When a `string.equals` function is encountered, the assertion returns true if:

1. The function has a receiver value and one parameter.
2. Both the receiver value and the parameter value are not BCrypted-strings.
3. Both the receiver value and the parameter value are either (a) a known secret or (b) match a secret regexp
