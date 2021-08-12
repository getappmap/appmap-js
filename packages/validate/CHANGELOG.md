# [@appland/appmap-validate-v2.0.0](https://github.com/applandinc/appmap-js/compare/@appland/appmap-validate-v1.0.0...@appland/appmap-validate-v2.0.0) (2021-08-12)


### Bug Fixes

* add defined_class in the keying between function call events and the classMap ([5ba2cde](https://github.com/applandinc/appmap-js/commit/5ba2cde48c9c4de78c36706989b285dec8d8a1b7))


### Features

* remove non-crucial dependencies to make run on the browser. ([0196ad9](https://github.com/applandinc/appmap-js/commit/0196ad962fb014eca8ca88a3b502642cc5afb837))


### BREAKING CHANGES

* the main function does no longer accept a path, instead the json data must be provided as first argument.

# @appland/appmap-validate-v1.0.0 (2021-06-16)


### Bug Fixes

* support for major.minor version format (ommition of patch) ([1c7add9](https://github.com/applandinc/appmap-js/commit/1c7add9a9d539327bebec5f9c261ed9cf0c50a6c))
* validate that the events are per-thread fifos ([3007c4b](https://github.com/applandinc/appmap-js/commit/3007c4b6b95ae551445ba6522bb42f56349c2ade))


### Features

* better error reporting for JSON schema error ([4e981c5](https://github.com/applandinc/appmap-js/commit/4e981c53a854ff0a12f41084fa037f5b06ab297d))
* Initial release of AppMap JSON validation ([#249](https://github.com/applandinc/appmap-js/issues/249)) ([05a5ed6](https://github.com/applandinc/appmap-js/commit/05a5ed6e99988dd3d378264ed227486dd7aacd17))
* support for older versions through macros (>= 1.2.0) ([6113102](https://github.com/applandinc/appmap-js/commit/61131020b8fe7a43d7750ab26859ed1abf72585b))
