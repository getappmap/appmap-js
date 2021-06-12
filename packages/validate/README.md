# appmap-validate

Check whether an appmap adheres to the specification.

## Install

```sh
npm i @appland/validate
```

## CLI

```sh
npx appmap-validate [--version 1.6.0] path/to/file.appmap.json
```

## API

```js
const {validate} = require("appmap-validate");
// Returns undefined if the appmap is valid
// Throws an InputError if there was a problem with the input options
// Throws an InvalidAppmapError if the provided appmap is invalid
// Any other thrown error should be considered as a bug
validate({
  path, // either provide a path to an appmap file
  data, // or directly provide the JSON-parsed data
  version // appmap specification version (currently only 1.6.0)
});
```

## Design Decision

- Every object is extensible
- Every optional property is nullable

## Versions

At the moment there is only json schema for every supported version.

- `1.6.0`: The appmap spec becomes more permissive:
  - `parameters.name` becomes recommended instead of required
  - `parameters.object_id`: becomes recommended instead of required
- `1.5.1`: No breaking changes
- `1.5.0`: No breaking changes
- `1.4.1`: The appmap spec becomes more permissive:
  - `FunctionCodeObject.source` becomes optional instead of required
  - `FunctionCallEvent.receiver` becomes optional instead of required
- `1.4.0`: No breaking changes
- `1.3.0`: No breaking changes
- `1.2.0`: Many breaking changes which prevent the tool from supporting reasonably well older versions.

Because the spec become slightly more permissive since `1.2.0`, this tool produce some false positives.
For instance it will say the the appmap below is valid whereas it is not.

```json
{
  "version": "1.5.1",
  "metadata": {
    "client": {
      "name": "appmap-validate",
      "url": "https://github.com/applandinc/appmap-validate"
    },
    "recorder": {
      "name": "appmap-validate"
    }
  },
  "classMap": [],
  "events": [
    {
      "event": "call",
      "id": 5,
      "thread_id": 123,
      "http_server_request": {
        "request_method": "GET",
        "path_info": "/foo/",
        
      },
      "message": [{
        name: 
      }]
    },
    {
      "event": "return",
      "id": 6,
      "thread_id": 456,
      "parent_id": 5,
      "http_server_response": {
        "status_code": 200
      }
    },
    {
      "event": "call",
      "id": 7,
      "thread_id": 456,
      "http_client_request": {
        "request_method": "GET",
        "url": "/foo"
      },
      "message": []
    },
    {
      "event": "return",
      "id": 8,
      "thread_id": 456,
      "parent_id": 7,
      "http_client_response": {
        "status_code": 200
      }
    }
  ]
}
```
