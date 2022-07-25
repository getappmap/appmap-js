# [@appland/models-v1.18.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.17.0...@appland/models-v1.18.0) (2022-07-25)


### Features

* Add Event.stableProperties ([9db0ea4](https://github.com/applandinc/appmap-js/commit/9db0ea49cc60f438c576704d799ac9711625d254))

# [@appland/models-v1.17.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.16.2...@appland/models-v1.17.0) (2022-07-12)


### Features

* Externalized code object id and type ([d88b7cd](https://github.com/applandinc/appmap-js/commit/d88b7cd21635d42d437e296dd6338f093f392982))

# [@appland/models-v1.16.2](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.16.1...@appland/models-v1.16.2) (2022-06-24)


### Bug Fixes

* Emit missing data fields to JSON ([abf3de3](https://github.com/applandinc/appmap-js/commit/abf3de334f89432b2c7b36e02c7e4ce96e556128))

# [@appland/models-v1.16.1](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.16.0...@appland/models-v1.16.1) (2022-06-15)


### Bug Fixes

* Handle deep structures in EventNavigator.descendants ([a66d768](https://github.com/applandinc/appmap-js/commit/a66d768c913f4a84e2f5362b82dc1db629de0c1e))

# [@appland/models-v1.16.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.15.0...@appland/models-v1.16.0) (2022-06-08)


### Features

* Apply eventUpdates when building an AppMap ([9cf9989](https://github.com/applandinc/appmap-js/commit/9cf99891e1cdd46c8a58d3030c039ac75e2bce4f))

# [@appland/models-v1.15.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.14.5...@appland/models-v1.15.0) (2022-04-05)


### Features

* Add OpenAPI response schema by mime type ([fb96895](https://github.com/applandinc/appmap-js/commit/fb96895e071aaa010a43aaa53da7e5e480a590d8))

# [@appland/models-v1.14.5](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.14.4...@appland/models-v1.14.5) (2022-04-01)


### Bug Fixes

* remove credentials from git repository URLs ([#560](https://github.com/applandinc/appmap-js/issues/560)) ([42cc0f9](https://github.com/applandinc/appmap-js/commit/42cc0f9043a9b2209a1343b2d019141c4044d491))

# [@appland/models-v1.14.4](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.14.3...@appland/models-v1.14.4) (2022-03-30)


### Bug Fixes

* Normalize HTTP server request path info ([#558](https://github.com/applandinc/appmap-js/issues/558)) ([a130aac](https://github.com/applandinc/appmap-js/commit/a130aac0180600df94a7a4b570f25ec4fa4ecb51))

# [@appland/models-v1.14.3](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.14.2...@appland/models-v1.14.3) (2022-03-10)


### Bug Fixes

* Filter out package children when children are not selected by root ([#538](https://github.com/applandinc/appmap-js/issues/538)) ([38698e5](https://github.com/applandinc/appmap-js/commit/38698e52d9e98c9f50ddaa23935347c2fd03e4f3))
* Normalize SQL strings with backslashes correctly ([715bd13](https://github.com/applandinc/appmap-js/commit/715bd13e6136d1496730f82d8a51da08702e7135))

# [@appland/models-v1.14.2](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.14.1...@appland/models-v1.14.2) (2022-03-01)


### Bug Fixes

* Update SQL parser ([8020ec3](https://github.com/applandinc/appmap-js/commit/8020ec3758e98f85d7fb36a040c444017ca98849))

# [@appland/models-v1.14.1](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.14.0...@appland/models-v1.14.1) (2022-02-12)


### Bug Fixes

* Update sql parser ([a69d0d1](https://github.com/applandinc/appmap-js/commit/a69d0d166793c3d7c369634bb07c021693831560))
* When normalizing SQL don't replace comments with a placeholder ([e3b2e03](https://github.com/applandinc/appmap-js/commit/e3b2e03f4b9a81cde39d419c98bc7cc41ab35ec7))

# [@appland/models-v1.14.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.13.0...@appland/models-v1.14.0) (2022-02-11)


### Bug Fixes

* Expect Content-Type header instead of mime_type field ([0886d8c](https://github.com/applandinc/appmap-js/commit/0886d8cf667e1b5b5325d26fd882a7586db29c25))


### Features

* Provide Event#requestContentType and #responseContentType ([31a6ff3](https://github.com/applandinc/appmap-js/commit/31a6ff37b53e2e58e5561a70a4417ec75416ef1a))

# [@appland/models-v1.13.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.12.1...@appland/models-v1.13.0) (2022-02-10)


### Features

* Upgrade SQL parser ([da5475e](https://github.com/applandinc/appmap-js/commit/da5475e47cb3943ea83c8380042178f7b289583f))

# [@appland/models-v1.12.1](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.12.0...@appland/models-v1.12.1) (2022-02-03)


### Bug Fixes

* Improved event hash ([5b14997](https://github.com/applandinc/appmap-js/commit/5b14997c53cc692f04dda50465e0933149daabbf))
* SQL event hash falls back on query normalization ([735e74c](https://github.com/applandinc/appmap-js/commit/735e74c1baaa7f3e369a3fbbcdf645de0f2fc73f))

# [@appland/models-v1.12.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.11.0...@appland/models-v1.12.0) (2022-02-03)


### Bug Fixes

* Specify event constructor type definition ([dacf26d](https://github.com/applandinc/appmap-js/commit/dacf26dc7b74d6bc0ba41fbea2ea17b18b01843a))


### Features

* Callback function on SQL parse error ([1ca4f53](https://github.com/applandinc/appmap-js/commit/1ca4f5314f8c0c82d6c37378517048a486426bdc))
* Refactor SQL utilities into @appland/models ([ef8a9be](https://github.com/applandinc/appmap-js/commit/ef8a9bebb08f08959272af24f8a8069514107681))

# [@appland/models-v1.11.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.10.1...@appland/models-v1.11.0) (2022-01-18)


### Features

* Port prune subcommand ([fd1d724](https://github.com/applandinc/appmap-js/commit/fd1d7240c2ce8d1fb3227713ab78a1a9761e14a5))

# [@appland/models-v1.10.1](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.10.0...@appland/models-v1.10.1) (2022-01-07)


### Bug Fixes

* descandants performs DFS traversal ([ae136cb](https://github.com/applandinc/appmap-js/commit/ae136cb669283534b9073e273f798ad0803e88ae))

# [@appland/models-v1.10.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.9.0...@appland/models-v1.10.0) (2022-01-05)


### Features

* Add detailed types for Metadata and SqliteParser ([2b74363](https://github.com/applandinc/appmap-js/commit/2b74363cbcecfa50bbc942a20c85da8d9af745d9))
* Use SqliteParser types ([75982aa](https://github.com/applandinc/appmap-js/commit/75982aab2c9a37aa254de50ef0e53c6b674ddbea))

# [@appland/models-v1.9.0](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.8.1...@appland/models-v1.9.0) (2021-12-14)


### Features

* Export type definitions ([bfee7ec](https://github.com/applandinc/appmap-js/commit/bfee7ec72ba63044dd82751c877b74348ebd8e88))

# [@appland/models-v1.8.1](https://github.com/applandinc/appmap-js/compare/@appland/models-v1.8.0...@appland/models-v1.8.1) (2021-12-09)


### Bug Fixes

* Use @appland/sql-parser ([a9335a7](https://github.com/applandinc/appmap-js/commit/a9335a7273f54c6039875270c3ea11f5b57f2333))

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
