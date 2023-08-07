# [@appland/appmap-validate-v2.4.0](https://github.com/getappmap/appmap-js/compare/@appland/appmap-validate-v2.3.0...@appland/appmap-validate-v2.4.0) (2023-08-07)


### Features

* detect function missing from classmap ([e6cede9](https://github.com/getappmap/appmap-js/commit/e6cede95b277fbda4fd70c71e27a9da0b5e07e10))
* support partial version number ([21dc1ba](https://github.com/getappmap/appmap-js/commit/21dc1ba7425081796452010ddcbe8a6f7c5356c5))

# [@appland/appmap-validate-v2.3.0](https://github.com/getappmap/appmap-js/compare/@appland/appmap-validate-v2.2.0...@appland/appmap-validate-v2.3.0) (2022-07-07)

### Features

- make sure every optional field is nullable
  ([0a810d3](https://github.com/getappmap/appmap-js/commit/0a810d363417254288ac703b6faf3d21aa87b364))

# [@appland/appmap-validate-v2.2.0](https://github.com/getappmap/appmap-js/compare/@appland/appmap-validate-v2.1.0...@appland/appmap-validate-v2.2.0) (2022-07-06)

### Features

- validate eventUpdates from 1.8.0
  ([edf21fe](https://github.com/getappmap/appmap-js/commit/edf21fe8ea69429f3353e4fe9fc2b581639fa8ff))

# [@appland/appmap-validate-v2.1.0](https://github.com/getappmap/appmap-js/compare/@appland/appmap-validate-v2.0.0...@appland/appmap-validate-v2.1.0) (2021-12-06)

### Bug Fixes

- fix broken bin/index.js file
  ([70fcaed](https://github.com/getappmap/appmap-js/commit/70fcaed1e2c04b2edbc696e03f018b8c8a76189f))
- used appmap-scoped monotonous constraint
  ([34af3c8](https://github.com/getappmap/appmap-js/commit/34af3c83679e1745427b80ec8b2869b9a6eeaf08))

### Features

- add constraint for continuous indexing (start at 1)
  ([ed919a6](https://github.com/getappmap/appmap-js/commit/ed919a689d450991bbc4ba49c65c75794be0f042))

# [@appland/appmap-validate-v2.0.0](https://github.com/getappmap/appmap-js/compare/@appland/appmap-validate-v1.0.0...@appland/appmap-validate-v2.0.0) (2021-08-12)

### Bug Fixes

- add defined_class in the keying between function call events and the classMap
  ([5ba2cde](https://github.com/getappmap/appmap-js/commit/5ba2cde48c9c4de78c36706989b285dec8d8a1b7))

### Features

- remove non-crucial dependencies to make run on the browser.
  ([0196ad9](https://github.com/getappmap/appmap-js/commit/0196ad962fb014eca8ca88a3b502642cc5afb837))

### BREAKING CHANGES

- the main function does no longer accept a path, instead the json data must be provided as first
  argument.

# @appland/appmap-validate-v1.0.0 (2021-06-16)

### Bug Fixes

- support for major.minor version format (ommition of patch)
  ([1c7add9](https://github.com/getappmap/appmap-js/commit/1c7add9a9d539327bebec5f9c261ed9cf0c50a6c))
- validate that the events are per-thread fifos
  ([3007c4b](https://github.com/getappmap/appmap-js/commit/3007c4b6b95ae551445ba6522bb42f56349c2ade))

### Features

- better error reporting for JSON schema error
  ([4e981c5](https://github.com/getappmap/appmap-js/commit/4e981c53a854ff0a12f41084fa037f5b06ab297d))
- Initial release of AppMap JSON validation
  ([#249](https://github.com/getappmap/appmap-js/issues/249))
  ([05a5ed6](https://github.com/getappmap/appmap-js/commit/05a5ed6e99988dd3d378264ed227486dd7aacd17))
- support for older versions through macros (>= 1.2.0)
  ([6113102](https://github.com/getappmap/appmap-js/commit/61131020b8fe7a43d7750ab26859ed1abf72585b))
