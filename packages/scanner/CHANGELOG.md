# [1.24.0](https://github.com/applandinc/scanner/compare/v1.23.0...v1.24.0) (2021-11-29)


### Features

* Scanner for job not cancelled ([2ec0488](https://github.com/applandinc/scanner/commit/2ec0488f619de85c4dfaefa3a45addcdffae9816))

# [1.23.0](https://github.com/applandinc/scanner/compare/v1.22.2...v1.23.0) (2021-11-22)


### Bug Fixes

* Ensure existance of constants for all labels ([451eddb](https://github.com/applandinc/scanner/commit/451eddb50d486724edb8f3f8117ba21993e63385))
* Update rails sample app config ([551a67d](https://github.com/applandinc/scanner/commit/551a67dd92ce2a2d02de1aed08f17431cdc2d2a5))


### Features

* Reconcile and standardize scanner options ([e5dcedb](https://github.com/applandinc/scanner/commit/e5dcedbefb4b504ff0752db6d9d51e6e11944bbd))
* Support regexp or function as filter expression ([88a5fab](https://github.com/applandinc/scanner/commit/88a5fabaf7e6b995f8d730f3221ee7597686cfdb))
* Validate configuration schema before scanning ([53d4e9d](https://github.com/applandinc/scanner/commit/53d4e9d1395e8020e358000c4e3a8f8f53eb7890))
* Validate scanner properties against Options defined by JSON schema ([cbd9167](https://github.com/applandinc/scanner/commit/cbd9167a49b3725bab4cfef333750b4c5e806788))

## [1.22.2](https://github.com/applandinc/scanner/compare/v1.22.1...v1.22.2) (2021-11-17)


### Bug Fixes

* Expose finding hash ([6ef2565](https://github.com/applandinc/scanner/commit/6ef256571894c9b5eae4c11ad499c2a148308d85))

## [1.22.1](https://github.com/applandinc/scanner/compare/v1.22.0...v1.22.1) (2021-11-16)


### Bug Fixes

* disable yarn cache ([baae1a3](https://github.com/applandinc/scanner/commit/baae1a37064df1a276941715816940aedc49ad74))

# [1.22.0](https://github.com/applandinc/scanner/compare/v1.21.0...v1.22.0) (2021-11-16)


### Bug Fixes

* Copy sampleConfig files to built directory ([f89d7aa](https://github.com/applandinc/scanner/commit/f89d7aac435407b81c07b6cc4c6f107a9950c3d4))
* Ensure existance of built directory when copying sample config ([0e047ed](https://github.com/applandinc/scanner/commit/0e047edaa3564d771d417ab69e3483d99eafa85c))
* Fail the scan when no appmap dir or file is specified ([501deae](https://github.com/applandinc/scanner/commit/501deae182fb4aa51d07480ec0de230f78cbf994))


### Features

* Update default config with no-label scanners ([c1c7a6f](https://github.com/applandinc/scanner/commit/c1c7a6fd98b4ce48aebcf144dbb18a963fab18df))

# [1.21.0](https://github.com/applandinc/scanner/compare/v1.20.1...v1.21.0) (2021-11-16)


### Features

* Find unbatched materialized query ([2e3535b](https://github.com/applandinc/scanner/commit/2e3535b7443c18b279ef6f5e5901926f064cefff))
* Specify types for scanner options and export as JSON schema ([ed197ca](https://github.com/applandinc/scanner/commit/ed197cab2db49d7c7adbe8caea537984f9a98676))

## [1.20.1](https://github.com/applandinc/scanner/compare/v1.20.0...v1.20.1) (2021-11-12)


### Bug Fixes

* Remove broken scope 'appmap' ([fad8ffa](https://github.com/applandinc/scanner/commit/fad8ffaa4959db973bacdf7589a208a78c479c40))
* Update and correct use of scopes and enumerateScope by scanners ([9395113](https://github.com/applandinc/scanner/commit/939511379654f59b89d2976970e3da457062baa9))
* Update Rails Sample App use of scanners ([1e64211](https://github.com/applandinc/scanner/commit/1e64211854a8b93e4a56272801d4b913b6905c0a))

# [1.20.0](https://github.com/applandinc/scanner/compare/v1.19.0...v1.20.0) (2021-11-09)


### Features

* Scan for authorization before authentication ([3d3b1eb](https://github.com/applandinc/scanner/commit/3d3b1eb21870728e02cd4fb064325f7d2e274f89))

# [1.19.0](https://github.com/applandinc/scanner/compare/v1.18.0...v1.19.0) (2021-11-09)


### Bug Fixes

* Upgrade semantic-release ([45dad94](https://github.com/applandinc/scanner/commit/45dad947ba13be458cda12ea920dc22ff9d02d94))


### Features

* Scan for too many joins ([1de7bfc](https://github.com/applandinc/scanner/commit/1de7bfcf40b39dd521bc7676ed0842a50a0ef742))

# [1.18.0](https://github.com/applandinc/scanner/compare/v1.17.0...v1.18.0) (2021-11-04)


### Bug Fixes

* Disable IDE links when exporting findings to a file ([9bbea63](https://github.com/applandinc/scanner/commit/9bbea638402fc9ed7bce7dd3ef9ebe4ef7a8fea0))


### Features

* Add AssertionSpec type for scanner definitions ([74de27a](https://github.com/applandinc/scanner/commit/74de27a071eeb689950e5e5d1da8c19804d3d537))
* Add CI integration docs ([1dc0ad4](https://github.com/applandinc/scanner/commit/1dc0ad462f6602f704e737fb737960cff8f65081))
* Add OpenAPI generation for http_client_request ([1fc93e1](https://github.com/applandinc/scanner/commit/1fc93e181ac6ac1d335a49fda72582f81f13802e))
* Add scanner for slow method calls ([e5366fa](https://github.com/applandinc/scanner/commit/e5366fa31a4fe506e1ad27c9b0a16f7310f8610b))
* Analyze and print OpenAPI breaking changes ([858f833](https://github.com/applandinc/scanner/commit/858f83383f136bd329e7e83dd2f488f1c6f2d33e))
* OpenAPI schema are cached by host ([4b2ac60](https://github.com/applandinc/scanner/commit/4b2ac60d74e326325759ddf0f83b8ab9d3d91ecb))
* Report distinct finding messages in the final summary ([3f946ba](https://github.com/applandinc/scanner/commit/3f946bab9cc2bf7e8ba83e219687002a6241822f))

# [1.17.0](https://github.com/applandinc/scanner/compare/v1.16.0...v1.17.0) (2021-10-21)


### Bug Fixes

* Fix env var name for commit status ([444491c](https://github.com/applandinc/scanner/commit/444491c453113c1eb5b80f4a168e236d86c63f54))
* Increase the threshold for "too-many-updates" ([0b69a6e](https://github.com/applandinc/scanner/commit/0b69a6eef97d49e036f6d484a2b7ecc9fe1a4314))
* Remove unused import ([44bb518](https://github.com/applandinc/scanner/commit/44bb5181e023e033c22b41e35c365a9e25680d07))
* Report the total match number for n+1 and too-many-updates ([ae4c015](https://github.com/applandinc/scanner/commit/ae4c01539ff174401643ca8145df15be348576eb))


### Features

* Assertion can choose whether to check all events in the scope, or just the root ([5993f2c](https://github.com/applandinc/scanner/commit/5993f2c388f155194faa5573c90d2c2ad58d3419))
* Check rpc-without-circuit-breaker ([8eed0b0](https://github.com/applandinc/scanner/commit/8eed0b0b9f01336f6c52ce9e4f3bc196ddaf0de1))
* Optional pull request comments ([dd953d2](https://github.com/applandinc/scanner/commit/dd953d2c0636a66e550fdbd67ad7dbf5d4e6e83c))
* Report related events in a Finding ([9c75bdd](https://github.com/applandinc/scanner/commit/9c75bdd7d2a98db246d914f7d8320a55483d1766))

# [1.17.0](https://github.com/applandinc/scanner/compare/v1.16.0...v1.17.0) (2021-10-21)


### Bug Fixes

* Fix env var name for commit status ([444491c](https://github.com/applandinc/scanner/commit/444491c453113c1eb5b80f4a168e236d86c63f54))
* Increase the threshold for "too-many-updates" ([0b69a6e](https://github.com/applandinc/scanner/commit/0b69a6eef97d49e036f6d484a2b7ecc9fe1a4314))
* Remove unused import ([44bb518](https://github.com/applandinc/scanner/commit/44bb5181e023e033c22b41e35c365a9e25680d07))
* Report the total match number for n+1 and too-many-updates ([ae4c015](https://github.com/applandinc/scanner/commit/ae4c01539ff174401643ca8145df15be348576eb))


### Features

* Assertion can choose whether to check all events in the scope, or just the root ([5993f2c](https://github.com/applandinc/scanner/commit/5993f2c388f155194faa5573c90d2c2ad58d3419))
* Check rpc-without-circuit-breaker ([8eed0b0](https://github.com/applandinc/scanner/commit/8eed0b0b9f01336f6c52ce9e4f3bc196ddaf0de1))
* Optional pull request comments ([dd953d2](https://github.com/applandinc/scanner/commit/dd953d2c0636a66e550fdbd67ad7dbf5d4e6e83c))
* Report related events in a Finding ([9c75bdd](https://github.com/applandinc/scanner/commit/9c75bdd7d2a98db246d914f7d8320a55483d1766))

# [1.16.0](https://github.com/applandinc/scanner/compare/v1.15.0...v1.16.0) (2021-10-19)


### Bug Fixes

* Fix titled summary ([29dfe5e](https://github.com/applandinc/scanner/commit/29dfe5e9350f9c4108135d4e9aad92f3be376ee3))


### Features

* Add doc/architecture.md ([06ca4c5](https://github.com/applandinc/scanner/commit/06ca4c5bad5380d477cf862ac007d6e3cb88b4eb))
* Assertion is instantiated once for each scope occurrance, simplifying bookkeeping ([b007bc9](https://github.com/applandinc/scanner/commit/b007bc9094c63296dcf295dcee51eca39a64f475))
* Describe scopes in architecture doc ([27b1ebb](https://github.com/applandinc/scanner/commit/27b1ebb7244f64dbd062029683621b25adba4f4e))
* Implement scopes ([07cc23e](https://github.com/applandinc/scanner/commit/07cc23ed871a2ffce6e2dee477a4b259d650cc79))
* Update architecture doc with Scope concept ([043e4d9](https://github.com/applandinc/scanner/commit/043e4d9babb5f6cc290bfba95336d68fcad1d0de))

# [1.15.0](https://github.com/applandinc/scanner/compare/v1.14.0...v1.15.0) (2021-10-15)


### Features

* Illegal package dependency ([1b31cea](https://github.com/applandinc/scanner/commit/1b31cea8ccad8f52470eb880fcfd0d245578ba2f))

# [1.14.0](https://github.com/applandinc/scanner/compare/v1.13.0...v1.14.0) (2021-10-15)


### Bug Fixes

* Fix error/warning of n+1 query check ([6065085](https://github.com/applandinc/scanner/commit/606508585c32b1b5705cd62bbf90239295e006a4))


### Features

* Better findings report generation ([0065442](https://github.com/applandinc/scanner/commit/00654427f6850317e948d01d5cde6ae6a2b20c3b))
* Scan for http 500 error ([dd2dfb6](https://github.com/applandinc/scanner/commit/dd2dfb66983935e4649adfa9c009cf3b5dffe2bf))

# [1.13.0](https://github.com/applandinc/scanner/compare/v1.12.4...v1.13.0) (2021-10-15)


### Bug Fixes

* Fix short name for validateBeforeSave ([0cc4bcc](https://github.com/applandinc/scanner/commit/0cc4bccb2fa0fd1ff46fbbc036ebb1c3a934282b))
* Fixes to scanners ([b1a264a](https://github.com/applandinc/scanner/commit/b1a264a5c9dede1fc38ddfc12281365a09bfe75f))


### Features

* Add JSON reporting ([fe70006](https://github.com/applandinc/scanner/commit/fe700063d9b9f3c4c493178edc9a404e4dd81234))
* Find insecure comparison of secrets ([fd3f80e](https://github.com/applandinc/scanner/commit/fd3f80ebd520c8cc257dd321e84d23fbd74f7385))

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
