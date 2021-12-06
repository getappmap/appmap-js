# [@appland/models-v1.8.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.7.1...@appland/models-v1.8.0) (2021-12-06)


### Features

* Correctly parse some PostgreSQL-specific constructs ([52e0706](https://github.com/applandinc/appmap-js/commit/52e070676405ed4567b802a347f386fec4974651))

# [@appland/models-v1.7.1](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.7.0...@appland/models-v1.7.1) (2021-11-17)


### Bug Fixes

* Fix hash generation for events without parameters/labels ([703be7d](https://github.com/applandinc/appmap-js/commit/703be7d9cb8264c57202af2629179d9f2540deac))

# [@appland/models-v1.7.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.6.0...@appland/models-v1.7.0) (2021-11-11)


### Features

* expose function to build query AST ([29785e9](https://github.com/applandinc/appmap-js/commit/29785e91138182f9f927178b625be40da541d778))

# [@appland/models-v1.6.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.5.1...@appland/models-v1.6.0) (2021-11-01)


### Features

* Export parseNormalizeSQL and add joinsCount ([1f37628](https://github.com/applandinc/appmap-js/commit/1f37628e9c448176a0d068bd312ba4672e2f4925))

# [@appland/models-v1.5.1](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.5.0...@appland/models-v1.5.1) (2021-09-23)


### Bug Fixes

* add missing `elapsedTime` method to `Event` ([3f5b122](https://github.com/applandinc/appmap-js/commit/3f5b12274683a3f028151ef94f41f0f60827963c))

# [@appland/models-v1.5.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.4.0...@appland/models-v1.5.0) (2021-08-19)


### Features

* Add exceptions to Trace nodes ([#312](https://github.com/applandinc/appmap-js/issues/312)) ([620d86d](https://github.com/applandinc/appmap-js/commit/620d86d446a9757e6d31b43b0587a5027a58528c))

# [@appland/models-v1.4.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.3.1...@appland/models-v1.4.0) (2021-08-17)


### Features

* Add global filters ([#217](https://github.com/applandinc/appmap-js/issues/217)) ([3f16612](https://github.com/applandinc/appmap-js/commit/3f16612b7a876f94c81ca0414971c4c455b1a897))

# [@appland/models-v1.3.1](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.3.0...@appland/models-v1.3.1) (2021-07-30)


### Bug Fixes

* Move rollup dependencies to development ([7fbaae6](https://github.com/applandinc/appmap-js/commit/7fbaae69895307c1429ad764727d1f3bacd88181))

# [@appland/models-v1.3.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.2.0...@appland/models-v1.3.0) (2021-07-02)


### Bug Fixes

* Properly normalize 'pragma' query ([1f3b05d](https://github.com/applandinc/appmap-js/commit/1f3b05dbfd871e4446d5d2a8bfcf40474aedbb7f))
* Separately report query parse and analysis problems ([5121cb9](https://github.com/applandinc/appmap-js/commit/5121cb99809cf96b4f908c21419f22d60d01f841))


### Features

* Include event.depth property ([f1f8ee8](https://github.com/applandinc/appmap-js/commit/f1f8ee81ebea8b9e3b8783a22bc999219b1b2e50))
* Store the database_type in query classMap entries ([7a44af6](https://github.com/applandinc/appmap-js/commit/7a44af6504dc78574b3ba9eb5d1edb60d3124a44))

# [@appland/models-v1.2.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.1.0...@appland/models-v1.2.0) (2021-06-22)


### Bug Fixes

* Event#dataObjects was missing message objects from its return value ([ade2c31](https://github.com/applandinc/appmap-js/commit/ade2c31f316284a7232d914ba4fcec8b2c1ca4c7))
* Prevent access of non-array event messages ([15a9cc2](https://github.com/applandinc/appmap-js/commit/15a9cc2efce41451b83e2c35285de1644016fe3d))


### Features

* HTTP client requests ([0c0e833](https://github.com/applandinc/appmap-js/commit/0c0e8338d6d25bf11f73a17d035e2b424e670add))

# [@appland/models-v1.1.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.0.6...@appland/models-v1.1.0) (2021-06-16)


### Features

* Find and print info about a named function ([544db5c](https://github.com/applandinc/appmap-js/commit/544db5ca402d9e3399326f28da7d3a43a606f5c4))
* Test if an event is a regular function ([bb162d6](https://github.com/applandinc/appmap-js/commit/bb162d6b6431a4888872335c6eec5cf975b067bb))

# [@appland/models-v1.0.6](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.0.5...@appland/models-v1.0.6) (2021-06-03)


### Bug Fixes

* Optimize performance and behavior of ClassMap.bindEvents ([5bac5bd](https://github.com/applandinc/appmap-js/commit/5bac5bd90c1cc15ca05ff2d7920e9f17483f9dd4))

# [@appland/models-v1.0.5](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.0.4...@appland/models-v1.0.5) (2021-05-28)


### Bug Fixes

* Resolve an incorrect import of sha256 ([#227](https://github.com/applandinc/appmap-js/issues/227)) ([fc64ff9](https://github.com/applandinc/appmap-js/commit/fc64ff981046b5e1732b088889202f32924c407d))

# [@appland/models-v1.0.4](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.0.3...@appland/models-v1.0.4) (2021-05-18)


### Bug Fixes

* Update local dependencies ([f0d3281](https://github.com/applandinc/appmap-js/commit/f0d328161499999ee98fbb3aec2d438b3095bd0f))

# [@appland/models-v1.0.3](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.0.2...@appland/models-v1.0.3) (2021-05-18)


### Bug Fixes

* Bundle ESM/CJS without external dependencies ([0a38ac0](https://github.com/applandinc/appmap-js/commit/0a38ac0a57baa30c6b0ff00bb69503e4891f8858))

# [@appland/models-v1.0.2](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.0.1...@appland/models-v1.0.2) (2021-05-11)


### Bug Fixes

* Add publish config ([118c54f](https://github.com/applandinc/appmap-js/commit/118c54f3db08f19de39bca7d67abd36a0071a20e))

# [@appland/models-v1.0.1](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.0.0...@appland/models-v1.0.1) (2021-05-11)


### Bug Fixes

* Flag package as public ([67e179c](https://github.com/applandinc/appmap-js/commit/67e179cd72ba247903764de25d8c86e0dd07bf9b))

# @appland/models-v1.0.0 (2021-05-11)


### Features

* Initial release ([#195](https://github.com/applandinc/appmap-js/issues/195)) ([c4776a0](https://github.com/applandinc/appmap-js/commit/c4776a0514c333746846b8ffca88465f8c2739ee))
