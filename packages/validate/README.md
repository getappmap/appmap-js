# appmap-validate

Check whether an appmap adheres to the [specification](https://github.com/getappmap/appmap).

## Install

```sh
npm i @appland/validate
```

## CLI

```sh
npx appmap-validate path/to/file.appmap.json
```

## API

```js
const {validate} = require("appmap-validate");
// Returns undefined if the appmap is valid
// Throws an InputError if there was a problem with the input options
// Throws an InvalidAppmapError if the provided appmap is invalid
// Any other thrown error should be considered as a bug
validate(
  data,
  {
    version, // appmap specification version
    "schema-depth": 0 // depth of the schema to display
    "instance-depth": 0 // depth of the instance to display
  }
);
```

## Design Decisions

- _Every object is extensible_ Appmap producers are free to include additional properties. This can
  be useful to experiment with novel extensions which are not yet part of the spec. Also it can be
  useful to include additional data for debugging purpose.
- _Every optional property is nullable_ When a property is is not required, appmap producers have
  two options. Either they do not include the property in the object. Or they set its value to
  `null` which is easier/faster to do when using literal object notation. For instance, in js:
  ```js
  // Missing optional property:
  {
    required: 'foo',
    ...(test ? { optional: 'bar' } : {}),
  };
  // null optional property:
  {
    required: 'foo',
    optional: test ? 'bar' : null,
  };
  ```
