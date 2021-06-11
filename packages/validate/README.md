# appmap-validate

Check whether an appmap adheres to the specification.

## Install

```sh
npm i @appland/appmap-validate
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