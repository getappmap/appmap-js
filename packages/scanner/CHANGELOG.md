## [1.12.4](https://github.com/applandinc/scanner/compare/v1.12.3...v1.12.4) (2021-10-06)


### Bug Fixes

* await github responses ([ee4fd29](https://github.com/applandinc/scanner/commit/ee4fd29dc3786b1447de5c732d45a8723ebf2081))

## [1.12.3](https://github.com/applandinc/scanner/compare/v1.12.2...v1.12.3) (2021-10-06)


### Bug Fixes

* stringify response object ([69225a9](https://github.com/applandinc/scanner/commit/69225a9dfa1791becfde17a1d882b04f0fd5232f))

## [1.12.2](https://github.com/applandinc/scanner/compare/v1.12.1...v1.12.2) (2021-10-06)


### Bug Fixes

* use callback to print github responses ([7645931](https://github.com/applandinc/scanner/commit/76459314940310c1bc5a79449abbe215d8739bff))

## [1.12.1](https://github.com/applandinc/scanner/compare/v1.12.0...v1.12.1) (2021-10-06)


### Bug Fixes

* print github commit status responses ([c798deb](https://github.com/applandinc/scanner/commit/c798deb3706ada35e7306a482d56e1dbd77e83a9))

# [1.12.0](https://github.com/applandinc/scanner/compare/v1.11.2...v1.12.0) (2021-10-05)


### Features

* Configure scanner properties from YAML ([690ed5f](https://github.com/applandinc/scanner/commit/690ed5f4b6dfadde23de11446c1e93abe95ff89e))
* Enumerate labels which are used in the scanner ([827d56f](https://github.com/applandinc/scanner/commit/827d56fa80ac9c21ac5ce2e09d0552df5b64045d))

## [1.11.2](https://github.com/applandinc/scanner/compare/v1.11.1...v1.11.2) (2021-10-05)


### Bug Fixes

* include secretsRegexes.json into built directory ([b733283](https://github.com/applandinc/scanner/commit/b7332835566f2b7bf03f3b14601cb14b641105dc))

## [1.11.1](https://github.com/applandinc/scanner/compare/v1.11.0...v1.11.1) (2021-10-05)


### Bug Fixes

* properly read owner/repo/sha ([ca02937](https://github.com/applandinc/scanner/commit/ca0293774a552ede96a4804faba2782e815299e7))

# [1.11.0](https://github.com/applandinc/scanner/compare/v1.10.0...v1.11.0) (2021-10-01)


### Bug Fixes

* Don't write results into appmap index dir (which may not exist) ([ff402cb](https://github.com/applandinc/scanner/commit/ff402cbbe31636bad48247b1d18549998288075e))
* Fix declaration of Event#returnValue ([97b4b36](https://github.com/applandinc/scanner/commit/97b4b364587f7f0685719ae1171af0c30ffe265a))
* Implement proper usage of HTTP status and mime_type ([bb56aef](https://github.com/applandinc/scanner/commit/bb56aef2c7b62520779b40e3dc0fd213ae731c74))
* Leave absolute paths alone when generating links ([ab9f358](https://github.com/applandinc/scanner/commit/ab9f358151af69529406cee070501d812446b27b))


### Features

* Add a generic secret regexp ([7fa5e22](https://github.com/applandinc/scanner/commit/7fa5e229f145eda8e14f291ad95442216ba8f726))
* Deeper verbose logging ([970171c](https://github.com/applandinc/scanner/commit/970171c6903e3b6d0fb14324a98135aa7d4717ec))
* Enable multiple matches, custom messages, and problem level ([206c9b5](https://github.com/applandinc/scanner/commit/206c9b58e457673cb2403666d9c41c834c40c2fe))
* Enable validation of a single AppMap file ([a75e336](https://github.com/applandinc/scanner/commit/a75e3367c28c8c01bc518b745b9984666e54acea))
* Find actual allocated secrets in logs ([29471a5](https://github.com/applandinc/scanner/commit/29471a5585f4114744381ec73e91320fe01d79b4))
* Refactor command printed output and exit status codes ([c6a134a](https://github.com/applandinc/scanner/commit/c6a134ac33cf95c00a80994421f26ecef6806755))

# [1.10.0](https://github.com/applandinc/scanner/compare/v1.9.0...v1.10.0) (2021-10-01)


### Features

* Scanner are classes with named fields ([2bce496](https://github.com/applandinc/scanner/commit/2bce4969c715e913430023e182e0369544bc85ca))

# [1.9.0](https://github.com/applandinc/scanner/compare/v1.8.0...v1.9.0) (2021-10-01)


### Features

* post commit status to GitHub ([5298ff2](https://github.com/applandinc/scanner/commit/5298ff24e7c1e5feec13a39365584ef181fa64e2))

# [1.8.0](https://github.com/applandinc/scanner/compare/v1.7.0...v1.8.0) (2021-09-30)


### Bug Fixes

* Match slow query if any include pattern matches ([1478b9a](https://github.com/applandinc/scanner/commit/1478b9a2d47867ef32621025cc492f0c5420e432))


### Features

* Scan for SQL update in GET/HEAD request ([e00a85e](https://github.com/applandinc/scanner/commit/e00a85e664f21ddfb6f1409633c556f324f4ee86))

# [1.7.0](https://github.com/applandinc/scanner/compare/v1.6.2...v1.7.0) (2021-09-29)


### Features

* Update GitHub token format ([e765624](https://github.com/applandinc/scanner/commit/e76562405c8a28c050297f3bb6c5b16f69704f84))

## [1.6.2](https://github.com/applandinc/scanner/compare/v1.6.1...v1.6.2) (2021-09-23)


### Bug Fixes

* replace ms with s ([83f0cf2](https://github.com/applandinc/scanner/commit/83f0cf20f615110c5c5ad6c265df98db0e250364))

## [1.6.1](https://github.com/applandinc/scanner/compare/v1.6.0...v1.6.1) (2021-09-23)


### Bug Fixes

* Update [@appmap](https://github.com/appmap) deps ([f2b1cda](https://github.com/applandinc/scanner/commit/f2b1cdac1b7c1a7bc40f6ad0a3752e7227d5225e))

# [1.6.0](https://github.com/applandinc/scanner/compare/v1.5.6...v1.6.0) (2021-09-22)


### Bug Fixes

* Change default assertions config to be .js ([58a9c4d](https://github.com/applandinc/scanner/commit/58a9c4d6421582a3119b1c36b9a61f5ab3978642))


### Features

* Pass state to VS Code links ([94efff9](https://github.com/applandinc/scanner/commit/94efff906a5e97aaeda896641381fec46c930d55))

## [1.5.6](https://github.com/applandinc/scanner/compare/v1.5.5...v1.5.6) (2021-09-21)


### Bug Fixes

* Fix path appmaps for IDE links ([3344d40](https://github.com/applandinc/scanner/commit/3344d405000d345563a79555d14b9c28ef1b01e0))

## [1.5.5](https://github.com/applandinc/scanner/compare/v1.5.4...v1.5.5) (2021-09-21)


### Bug Fixes

* Fix path to appmap's cli ([1f38306](https://github.com/applandinc/scanner/commit/1f383064541684f858d32d80557222a0c7a92c59))

## [1.5.4](https://github.com/applandinc/scanner/compare/v1.5.3...v1.5.4) (2021-09-21)


### Bug Fixes

* Revert bin path ([4d72f53](https://github.com/applandinc/scanner/commit/4d72f53d325896332a30f56ad2d324e6298b28ec))

## [1.5.3](https://github.com/applandinc/scanner/compare/v1.5.2...v1.5.3) (2021-09-21)


### Bug Fixes

* Fix hashbang ([325e4d6](https://github.com/applandinc/scanner/commit/325e4d6420c89de537bc11cedae3ef8a33d9ce45))

## [1.5.2](https://github.com/applandinc/scanner/compare/v1.5.1...v1.5.2) (2021-09-21)


### Bug Fixes

* Add executable with hashbang ([ab42f06](https://github.com/applandinc/scanner/commit/ab42f06605b2b0c740abbbf75cff714a4785eaa4))

## [1.5.1](https://github.com/applandinc/scanner/compare/v1.5.0...v1.5.1) (2021-09-21)


### Bug Fixes

* Fix bin path ([13bdc01](https://github.com/applandinc/scanner/commit/13bdc017e187a78e215da79f69e406972d78e44e))

# [1.5.0](https://github.com/applandinc/scanner/compare/v1.4.0...v1.5.0) (2021-09-20)


### Features

* Add summary by scanners ([a3e9465](https://github.com/applandinc/scanner/commit/a3e9465d095e41d82da855d1df35389beb4cea5e))

# [1.4.0](https://github.com/applandinc/scanner/compare/v1.3.0...v1.4.0) (2021-09-08)


### Features

* Rename 'failures' to 'matches' ([a1675a6](https://github.com/applandinc/scanner/commit/a1675a65ebf9b6a198113255624247a707aa3d7b))
* Write scanner results into AppMap index ([ed029bf](https://github.com/applandinc/scanner/commit/ed029bfb40826e4542f55c8a42daa1dbf2b11f56))

# [1.3.0](https://github.com/applandinc/scanner/compare/v1.2.0...v1.3.0) (2021-09-08)


### Bug Fixes

* Clarify the role of assertion config id ([d72493a](https://github.com/applandinc/scanner/commit/d72493accc711be1edf48a245df8ed71db3b25fb))


### Features

* Enable configuration of builtin scanners via YAML ([3f3cd16](https://github.com/applandinc/scanner/commit/3f3cd16d25d6dd4b2849eb4f26ab83ba6a00d2cd))
* Rename some scanners to better indicate the problem ([6338ab2](https://github.com/applandinc/scanner/commit/6338ab2ada1ae767b97dac4a031fa18b2c5fdb2d))
* typedef EventFilter ([3876792](https://github.com/applandinc/scanner/commit/3876792d09ea683c01efafcec34a367f74912fd9))

# [1.2.0](https://github.com/applandinc/scanner/compare/v1.1.0...v1.2.0) (2021-09-08)


### Bug Fixes

* Detect query from view as mvc.template label ([24e164f](https://github.com/applandinc/scanner/commit/24e164f776299bd0b4c90f5d12f14ea7019ba3e0))
* Don't report repated matches of N+1 query ([9105ac8](https://github.com/applandinc/scanner/commit/9105ac86a740637f02fcc5274af1cb7713408d44))
* Remove import of string from yargs ([4124d95](https://github.com/applandinc/scanner/commit/4124d95f675074fceb45988fe2bba0c67e9ba0e3))


### Features

* Add new scanners ([99430f2](https://github.com/applandinc/scanner/commit/99430f245db57cf5aa876dbfc8fb0d0c0e491326))
* Copy query normalization code from @appland/models ([5d49afb](https://github.com/applandinc/scanner/commit/5d49afbe60a8b0f02e7f996eb72ca6fac8d1c2e1))
* Ensure that certain events are leaf nodes ([4e9d15b](https://github.com/applandinc/scanner/commit/4e9d15b2f79ca097d6d8f42bc61e5d927632b664))
* Ensure that validate is called before save ([eb20b44](https://github.com/applandinc/scanner/commit/eb20b443dcb9c0cf154261c32f680a9e22e31454))
* N+1 query scanner ([b767024](https://github.com/applandinc/scanner/commit/b767024eda016519066daa24f0d609873c4aefe2))

# [1.1.0](https://github.com/applandinc/scanner/compare/v1.0.1...v1.1.0) (2021-09-07)


### Features

* Read configuration from yaml ([bc166f4](https://github.com/applandinc/scanner/commit/bc166f4dbed7dc4a7cbf7fd58c7d172c6bcac53f))

## [1.0.1](https://github.com/applandinc/scanner/compare/v1.0.0...v1.0.1) (2021-09-07)


### Bug Fixes

* Rename package to `scanners` ([1bd10cd](https://github.com/applandinc/scanner/commit/1bd10cd3bdf1310930a23ebdfec453aa9e700829))

# 1.0.0 (2021-09-07)


### Features

* Initial release ([cbea9f3](https://github.com/applandinc/scanner/commit/cbea9f38f5d7f612716a21a3fd7db342f889e88a))
