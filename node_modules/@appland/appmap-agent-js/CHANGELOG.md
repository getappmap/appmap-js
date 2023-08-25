# [13.9.0](https://github.com/getappmap/appmap-agent-js/compare/v13.8.0...v13.9.0) (2023-05-15)


### Bug Fixes

* add data url in JSON schema ([f8abc37](https://github.com/getappmap/appmap-agent-js/commit/f8abc37152904ef3e1fdc000b85a2fc9e1481534))
* do not crash on missing source map ([d025826](https://github.com/getappmap/appmap-agent-js/commit/d0258263d6c4f25daec713cf48953f0a7a69e6f3))
* more restrictive schema to improve error message ([e1f5531](https://github.com/getappmap/appmap-agent-js/commit/e1f5531d2f30e5c7b0469c1ab876f1a85d172340))
* prevent infinite recursion on user-defined toString ([d9a1715](https://github.com/getappmap/appmap-agent-js/commit/d9a17150a35b79061d65bbe869e9df52b0246b73))
* solve oom issue on large test suite ([773245e](https://github.com/getappmap/appmap-agent-js/commit/773245e29b3952dec52d09f7d81d35ecd346dec1))
* use trully pure convertions ([1416486](https://github.com/getappmap/appmap-agent-js/commit/1416486c2c6855028723ad63624b6ad5dd71ff47))


### Features

* improve feeedback for large appmaps ([0448fb8](https://github.com/getappmap/appmap-agent-js/commit/0448fb8f96a52db0dac406201edb7ac80f4e4e42))
* make babel parsing options configurable by the user ([f45d9c4](https://github.com/getappmap/appmap-agent-js/commit/f45d9c4136b83503533f5ff4ad198d95bf4ae1f9))
* no longer always exit with 0 ([3b6f55a](https://github.com/getappmap/appmap-agent-js/commit/3b6f55ae2ecb6d8d160c2e672f69b018bbdb193b))
* no longer requires the user to use jest --no-cache flag ([d0b260a](https://github.com/getappmap/appmap-agent-js/commit/d0b260a8dee10ae01b382249d95abd9206172b82))


### Performance Improvements

* use a more compact format to send message to the backend ([aba0510](https://github.com/getappmap/appmap-agent-js/commit/aba0510afa2a54dee3ebf9be8621a4816603d03f))

# [13.8.0](https://github.com/getappmap/appmap-agent-js/compare/v13.7.0...v13.8.0) (2023-04-27)


### Features

* Report unhandled exceptions ([b1fb7e6](https://github.com/getappmap/appmap-agent-js/commit/b1fb7e64646f36fcadd94d3e411d642227d70a1b))

# [13.7.0](https://github.com/getappmap/appmap-agent-js/compare/v13.6.0...v13.7.0) (2023-04-13)


### Features

* can record files with external urls ([c697916](https://github.com/getappmap/appmap-agent-js/commit/c697916df0ae13551eb2875a7f513640be134e93))
* record browser applications with man-in-the-middle proxy ([e896646](https://github.com/getappmap/appmap-agent-js/commit/e896646291b9ccddeb54254af98000d9cfdad1f5))
* support package and process matching against absolute url ([fadae4e](https://github.com/getappmap/appmap-agent-js/commit/fadae4e56aff4d52dd84c8d11ce51ec6ad7a1c48))


### Performance Improvements

* add dead instance in source component ([263756e](https://github.com/getappmap/appmap-agent-js/commit/263756ed56ecc814707749d21a13a34eda7a8020))
* cache browser recorder bundle to speed up html instrumentation ([662d759](https://github.com/getappmap/appmap-agent-js/commit/662d759734b00e61191d2199fe81447e99cc99f0))
* frontend no longer validate data ([13cfc30](https://github.com/getappmap/appmap-agent-js/commit/13cfc30206c08876d0df8ddb866c8fad266ad9a8))

# [13.6.0](https://github.com/getappmap/appmap-agent-js/compare/v13.5.2...v13.6.0) (2023-03-14)


### Bug Fixes

* cleanup JUMP_TAB in generator to support Generator.prototype.return ([361afc3](https://github.com/getappmap/appmap-agent-js/commit/361afc3b86b6b39832f5f37c682d59dee796930e))
* cleanup JUMP_TAB in generator to support Generator.prototype.throw ([0e390ed](https://github.com/getappmap/appmap-agent-js/commit/0e390ed3b8dc7c49e0a5da54006bc69b9a5389b7))
* no longer log undefined for the source url ([e5caf45](https://github.com/getappmap/appmap-agent-js/commit/e5caf4594e4a3780db806e3c25d393be05d4e378))
* use command-options.cwd to load jest config ([8b8a70c](https://github.com/getappmap/appmap-agent-js/commit/8b8a70c08466f08e243e0524588d5da0daf43480))


### Features

* support jest.config.js as esm ([e2cd6b6](https://github.com/getappmap/appmap-agent-js/commit/e2cd6b6d1b5b325234063d5273125fb5cf3c1aca))

## [13.5.2](https://github.com/getappmap/appmap-agent-js/compare/v13.5.1...v13.5.2) (2023-03-03)


### Bug Fixes

* Support class features when transforming source code ([46f03b0](https://github.com/getappmap/appmap-agent-js/commit/46f03b0cb1b088aa68c65cc73e3b5eaed6cc853b)), closes [#199](https://github.com/getappmap/appmap-agent-js/issues/199)

## [13.5.1](https://github.com/getappmap/appmap-agent-js/compare/v13.5.0...v13.5.1) (2023-02-22)


### Bug Fixes

* add loc on manufactured empty ast ([6f64aa3](https://github.com/getappmap/appmap-agent-js/commit/6f64aa3d3d0c3d396e2aafa32b5605cddc532d69))
* more robust ast lookup ([54bf1f5](https://github.com/getappmap/appmap-agent-js/commit/54bf1f58c0400844502ca63bed8638a5defcc13f))
* only use the last extension segment of urls for parsing ([fae2458](https://github.com/getappmap/appmap-agent-js/commit/fae2458b965e51d3050b7991b2b4d3d926a772f7))


### Performance Improvements

* do not load disabled source files ([5d488c2](https://github.com/getappmap/appmap-agent-js/commit/5d488c2aec7d7a33f6db91f2499cadd6847f3c91))
* faster url parsing ([e7c92dc](https://github.com/getappmap/appmap-agent-js/commit/e7c92dccb752ad1a5cc54830c2eb371f1273c199))

# [13.5.0](https://github.com/getappmap/appmap-agent-js/compare/v13.4.0...v13.5.0) (2023-02-17)


### Bug Fixes

* do not crash if a source file is missing ([15374c5](https://github.com/getappmap/appmap-agent-js/commit/15374c5c03e9553b0852f7c3b1bc98e8c80a70cc))
* handle default indirection on transformer ([5fd1a54](https://github.com/getappmap/appmap-agent-js/commit/5fd1a5479033ee790161cb631e07ccc29e9312c9))
* resolve recorder for unparsed commands ([8c8b6f7](https://github.com/getappmap/appmap-agent-js/commit/8c8b6f7660745a7cda131ffccb815969f1a4dc78))
* support jest transformer that directly returns string ([000dd6f](https://github.com/getappmap/appmap-agent-js/commit/000dd6fc74131fac9cbc866718cd456812f74744))


### Features

* appmap clients can be launched separately from appmap server ([75fcd20](https://github.com/getappmap/appmap-agent-js/commit/75fcd20007b74fdda38fe03bd27e680dc9ec624a))
* endless mode for batch when there is no command ([f290399](https://github.com/getappmap/appmap-agent-js/commit/f29039995e4655abdcfc608633b6e1f9530da52c))
* improve server logging ([58eddb1](https://github.com/getappmap/appmap-agent-js/commit/58eddb122aaa7d10317e9bb2d71bb00e6717362d))
* parse package invocation with yarn ([ea1f465](https://github.com/getappmap/appmap-agent-js/commit/ea1f4657e3d2c140745d94e8ff16a4867abfdc2c))
* support recording of concurrent node processes ([a4fc3f9](https://github.com/getappmap/appmap-agent-js/commit/a4fc3f90cdca5aa8cc84337a5e21af5fe1a0895a))


### Performance Improvements

* compile backend tracks one by one during flushing ([18112b2](https://github.com/getappmap/appmap-agent-js/commit/18112b26f4b5c0343c8cd10539fde3c681f74a85))

# [13.4.0](https://github.com/getappmap/appmap-agent-js/compare/v13.3.0...v13.4.0) (2023-02-11)


### Bug Fixes

* reverse order of apply summary ([1a29c1d](https://github.com/getappmap/appmap-agent-js/commit/1a29c1d540baae711c9dd675c1aee840f655b226))


### Features

* support for function exclusion on the frontend ([a5c968e](https://github.com/getappmap/appmap-agent-js/commit/a5c968e864ef36b95f85785b0fef51ad4c4b6a7a))
* support for smart postmortem-function-exclusion ([259574b](https://github.com/getappmap/appmap-agent-js/commit/259574bf38482695a693a3563d2f8789a88d4d52))

# [13.3.0](https://github.com/getappmap/appmap-agent-js/compare/v13.2.1...v13.3.0) (2023-02-10)


### Bug Fixes

* correct assertion argument order ([de59d4b](https://github.com/getappmap/appmap-agent-js/commit/de59d4b1329e3f1c0512e408294c7fd964f41ece))


### Features

* regularly flush appmaps from backend ([cdd0ef5](https://github.com/getappmap/appmap-agent-js/commit/cdd0ef5bb34430436ceab1485343c5d5cf5e9af1))

## [13.2.1](https://github.com/getappmap/appmap-agent-js/compare/v13.2.0...v13.2.1) (2023-02-07)


### Bug Fixes

* make pure serialization actually pure ([65e04a2](https://github.com/getappmap/appmap-agent-js/commit/65e04a261b397c0fdf4c36d4b3050edd604dd5ff))

# [13.2.0](https://github.com/getappmap/appmap-agent-js/compare/v13.1.2...v13.2.0) (2023-02-02)


### Features

* support for dynamic sources ([f169292](https://github.com/getappmap/appmap-agent-js/commit/f1692921e7f50571dfef19558cd16e8c6654b1ff))

## [13.1.2](https://github.com/getappmap/appmap-agent-js/compare/v13.1.1...v13.1.2) (2023-02-01)


### Bug Fixes

* Ignore duplicate async events ([b44937a](https://github.com/getappmap/appmap-agent-js/commit/b44937abc43b63939ea1d587db4fa13ae47c8b82))

## [13.1.1](https://github.com/getappmap/appmap-agent-js/compare/v13.1.0...v13.1.1) (2023-02-01)


### Bug Fixes

* wrap root function before exclusion ([185e50f](https://github.com/getappmap/appmap-agent-js/commit/185e50f53cd968c747ace6fd32f829b3b6065d16))

# [13.1.0](https://github.com/getappmap/appmap-agent-js/compare/v13.0.1...v13.1.0) (2023-01-31)


### Bug Fixes

* ignore json files in jest transformer ([6dbfc70](https://github.com/getappmap/appmap-agent-js/commit/6dbfc7031eefc881a7569ef76c8a80a88d4cba76))
* support concurrent jest test case ([75c9696](https://github.com/getappmap/appmap-agent-js/commit/75c9696d882841634722c6eb8561a0834d33958b))


### Features

* support jest preset ([15c5e5e](https://github.com/getappmap/appmap-agent-js/commit/15c5e5e9ca8ae1b8dd410a449ecd5817dca6ce87))

## [13.0.1](https://github.com/getappmap/appmap-agent-js/compare/v13.0.0...v13.0.1) (2023-01-25)


### Bug Fixes

* add undefined check for sourceRoot in source map ([6b1873b](https://github.com/getappmap/appmap-agent-js/commit/6b1873b695eb12b9ff55e7788cc2236fb1ca62dc))
* allow jest transformer in separate context ([731dcc0](https://github.com/getappmap/appmap-agent-js/commit/731dcc030073833a3c094b7304010eddbc749c3c))
* support running jest test in separate context ([2160e65](https://github.com/getappmap/appmap-agent-js/commit/2160e652a2043258ced6ba3e9f31889975437613))
* unique dynamic url for eval source ([9880202](https://github.com/getappmap/appmap-agent-js/commit/9880202572b9598bdade0357dbf0582464cafdcd))

# [13.0.0](https://github.com/getappmap/appmap-agent-js/compare/v12.2.0...v13.0.0) (2023-01-20)


### Bug Fixes

* instrument jest tests with transformers ([de5e92f](https://github.com/getappmap/appmap-agent-js/commit/de5e92fc1291e81430b4fc21af91422959d9eeed))


### Features

* allow query hook config to be null ([c5eeae7](https://github.com/getappmap/appmap-agent-js/commit/c5eeae759a36cf273f4bba2afa66dadba277972a))
* programs are directly spawned by default ([0f5bbcf](https://github.com/getappmap/appmap-agent-js/commit/0f5bbcf99ffb61b1c54a964ff16bca0cc5598819))
* tokenize every commands ([637cbab](https://github.com/getappmap/appmap-agent-js/commit/637cbab20d795df6171a3d3435496d69832f409d)), closes [/github.com/nodejs/node/blob/e58ed6d855e1af6579aaa50471426db8881eea99/lib/child_process.js#L619](https://github.com//github.com/nodejs/node/blob/e58ed6d855e1af6579aaa50471426db8881eea99/lib/child_process.js/issues/L619)
* use where.exe to locate missing exec on windows ([facd76d](https://github.com/getappmap/appmap-agent-js/commit/facd76db8e2fb54a22de09fd45763b7f81c63b00))


### BREAKING CHANGES

* By default, programs are no longer spawned inside a
shell. Rather, they are directly spawned with a system call.

# [12.2.0](https://github.com/getappmap/appmap-agent-js/compare/v12.1.2...v12.2.0) (2023-01-11)


### Features

* support additional command patterns for mocha and jest ([e9c84b7](https://github.com/getappmap/appmap-agent-js/commit/e9c84b788947cb8587881142efb61843864427cf))

## [12.1.2](https://github.com/getappmap/appmap-agent-js/compare/v12.1.1...v12.1.2) (2022-12-17)


### Bug Fixes

* more lenient source map url parsing ([7656c39](https://github.com/getappmap/appmap-agent-js/commit/7656c393ecd221c204631ba9d62fe4a4747b75ac))
* resilient zipping of arguments and parameters ([4920efc](https://github.com/getappmap/appmap-agent-js/commit/4920efcd56f0fd6b6d177853e34b29ba588db70d))
* return yield value intead of undefined ([dd93c64](https://github.com/getappmap/appmap-agent-js/commit/dd93c642027b17ba862165f46ea3b220b9622c30))
* use sourcesContent instead of contents in source map ([f1ae3b4](https://github.com/getappmap/appmap-agent-js/commit/f1ae3b49e2c3849699157f4c6cd788a5f9877bbf))

## [12.1.1](https://github.com/getappmap/appmap-agent-js/compare/v12.1.0...v12.1.1) (2022-12-14)


### Bug Fixes

* add missing bundles ([22ccf0d](https://github.com/getappmap/appmap-agent-js/commit/22ccf0d92c9c66e8fa8188b3df7a1a0db44c3a88))

# [12.1.0](https://github.com/getappmap/appmap-agent-js/compare/v12.0.0...v12.1.0) (2022-12-13)


### Bug Fixes

* adequate homepage even if the agent is missing ([606aaf0](https://github.com/getappmap/appmap-agent-js/commit/606aaf00730d097744021547287c54ce3ec0f2cc))
* use file urls to specify node loader ([6f49b2c](https://github.com/getappmap/appmap-agent-js/commit/6f49b2c1b2ef46cd09ee9f3bb0e082f26976602d))


### Features

* make status independent from uncaught error ([9c9a93f](https://github.com/getappmap/appmap-agent-js/commit/9c9a93f866a872853349ad98ef30a87bfe54eb32))
* more precise track termination ([97a598d](https://github.com/getappmap/appmap-agent-js/commit/97a598d2c646171e2c03532ad155abaff39d4114))
* support jest ([26ed907](https://github.com/getappmap/appmap-agent-js/commit/26ed907d21614b84d1d028b908a8af9e5edf9a56))

# [12.0.0](https://github.com/getappmap/appmap-agent-js/compare/v11.7.1...v12.0.0) (2022-11-21)


### Bug Fixes

* add separator for source root concatenation ([3b9da2b](https://github.com/getappmap/appmap-agent-js/commit/3b9da2b00da1f6fbf4b7b21286f6fd50a5318daa))
* no longer reset source column between source map groups ([66e2dc6](https://github.com/getappmap/appmap-agent-js/commit/66e2dc61102240a1e4ef386f873283216216645f))
* support incompatible source urls ([8fe9a5c](https://github.com/getappmap/appmap-agent-js/commit/8fe9a5cbabd9a0609d473ca223a75be0c3665160))
* use regexp instead of glob to exclude external files ([085848d](https://github.com/getappmap/appmap-agent-js/commit/085848df58f1e10ef4f4858a15729cd6336c5cc7))


### Code Refactoring

* remove outdated configuration fields ([5e44ad4](https://github.com/getappmap/appmap-agent-js/commit/5e44ad4cb75f60ac9b1a3d4df45f810d6fdff9bb))


### Features

* rewrite classmap processing ([a72a4f2](https://github.com/getappmap/appmap-agent-js/commit/a72a4f210adcf915bbefb27f938e45beb49969ef))


### Performance Improvements

* remove null fields from appmap ([5537f07](https://github.com/getappmap/appmap-agent-js/commit/5537f07bd91f20e8a51a37aa460cc21ced4f3916))


### BREAKING CHANGES

* `function-name-placeholder` and `anonymous-name-separator` are ignored.
* Nested functions are now represented alongside their class container. Function class container are necessary to represent nested functions because the classmap format does not allow for functions to have children. For instance, `function f () {}` was represented before as `{type:"class", name:"f", children:[{type:"function", name:"<placeholder>"}]}`. Now it is represented as: `[{type:"class", name:"f", children:[]}, {type:"function", name:"f"}]`. The class container is removed if it has no children.
* Files are represented as classes rather than packages. Plus their name no longer contain the file extension. Also, they are removed if the file does not contain top-level functions. Files as classes are necessary to provide a `defined_class` value to functions.
* Top level files are nested within a package named: `.`. That is because classes are not allowed at the root level of classmap.
* More aggressive naming. Before the agent would name code objects accordingly to the rule of dynamic function naming. For instance, `var f = (x) => {}` would cause the arrow to be named `x`. However, `var f = test ? (x) => {} || (y) => {}` would cause both arrows to have no name. The new naming algorithm is more aggressive to help reduce the number of anonymous code objects.
* Anonymous code object are always named `[anonymous]`. This is likely to change in the future.

## [11.7.1](https://github.com/getappmap/appmap-agent-js/compare/v11.7.0...v11.7.1) (2022-11-07)


### Bug Fixes

* provide path instead of url to spawn ([5ad873e](https://github.com/getappmap/appmap-agent-js/commit/5ad873e1c13e167ece1e0016b3a39f38ada2dc05))
* use error.name instead of constructor identity ([d217b59](https://github.com/getappmap/appmap-agent-js/commit/d217b59ae24e5506bb7d0f448e83b0a2ea1415a2))


### Performance Improvements

* remove outdated violation search param ([324aaeb](https://github.com/getappmap/appmap-agent-js/commit/324aaeba5e69162ffee9d335a3ea445b2c092387))

# [11.7.0](https://github.com/getappmap/appmap-agent-js/compare/v11.6.0...v11.7.0) (2022-10-28)


### Bug Fixes

* better feedback on incompatible mocha version ([1c2e718](https://github.com/getappmap/appmap-agent-js/commit/1c2e718c724d1000752a9c390b2c83474682de45))


### Features

* add user feedback on uncaught error ([6dd3d2e](https://github.com/getappmap/appmap-agent-js/commit/6dd3d2ea2af665aebb845815d1a1bc0f631c9b74))
* support node 19 ([d102720](https://github.com/getappmap/appmap-agent-js/commit/d102720e4c3f041c0ccdc9e11fe609043baccb83))

# [11.6.0](https://github.com/getappmap/appmap-agent-js/compare/v11.5.3...v11.6.0) (2022-10-22)


### Bug Fixes

* add missing configuration property ([ee267c3](https://github.com/getappmap/appmap-agent-js/commit/ee267c37d9997eff89ee336572a71e01acbb35c9))
* handle absolute windows path when resolving url ([b673238](https://github.com/getappmap/appmap-agent-js/commit/b673238ad89d9f1b88265890366042ca69c8f458))
* more portable line splitting for .env files ([7f8d0d8](https://github.com/getappmap/appmap-agent-js/commit/7f8d0d882929a17f104515def01cc60b2242abbd))
* normalize windows filename case ([df29f33](https://github.com/getappmap/appmap-agent-js/commit/df29f33260dcc4f0b3264722e45d9406ac050f69))
* use all cap env variable name ([b7f834f](https://github.com/getappmap/appmap-agent-js/commit/b7f834f0e273767844d83048623f6ace5bf90426))
* use file urls in NODE_OPTIONS ([f0959d8](https://github.com/getappmap/appmap-agent-js/commit/f0959d82b4179016a90669462d63bae524be9245))
* use import.meta.url instead of require self package ([3257c25](https://github.com/getappmap/appmap-agent-js/commit/3257c2587e66fb118053eb11a2e11f161003ee7e))
* use pure serialization for hash values ([c652bd4](https://github.com/getappmap/appmap-agent-js/commit/c652bd4343016b5d5612cc3b7d9e43b37620cc05))


### Features

* add configuration file when missing ([1214979](https://github.com/getappmap/appmap-agent-js/commit/1214979cc2f978abe2ad067fef2a27e349aba8a4))
* change default package exclusion ([0a0bfa1](https://github.com/getappmap/appmap-agent-js/commit/0a0bfa124523ef0dbf86aee1200dff69b8d2bdf8))
* consider SHELL env variable to define posix shell ([32fd562](https://github.com/getappmap/appmap-agent-js/commit/32fd5623d7d1dfac45b354b49ab93894f4957693))
* default recorder is process instead of remote ([341a1fa](https://github.com/getappmap/appmap-agent-js/commit/341a1fae7fd501acf4410e1250e4b023218c2956))
* preserve parsed command in configuration-accessor ([505c27b](https://github.com/getappmap/appmap-agent-js/commit/505c27b15f78782b78124df057219fba1646eed0))
* provide feedback if the stack overflows ([7a4e2b6](https://github.com/getappmap/appmap-agent-js/commit/7a4e2b6d67683fc7d6c1e167d4535da3d3edac65))
* support node-fashion shell command option ([48a0946](https://github.com/getappmap/appmap-agent-js/commit/48a094673323aa4de0416b5f78f693ad78ccce65))

## [11.5.3](https://github.com/getappmap/appmap-agent-js/compare/v11.5.2...v11.5.3) (2022-10-07)


### Bug Fixes

* test for both utf8 and utf-8 in data url ([50d9584](https://github.com/getappmap/appmap-agent-js/commit/50d9584857e1aa83cf98c3b22c735c3d9830d1cd))
* update github link ([e7ff866](https://github.com/getappmap/appmap-agent-js/commit/e7ff86617ab708e3d97d84d08a82f9ddbc2d4f4e))

## [11.5.2](https://github.com/applandinc/appmap-agent-js/compare/v11.5.1...v11.5.2) (2022-09-27)


### Bug Fixes

* resolve invalid format marker and detect future occurences ([f7a4205](https://github.com/applandinc/appmap-agent-js/commit/f7a4205e6d929c7c86e23884036c1c76d755527c))

## [11.5.1](https://github.com/applandinc/appmap-agent-js/compare/v11.5.0...v11.5.1) (2022-09-22)


### Bug Fixes

* restore config id in schema for external installer ([618ef2a](https://github.com/applandinc/appmap-agent-js/commit/618ef2a45827ebbb37627ae9ba606d31a17654fb))
* send only one error to the backend on disconnect ([1b42487](https://github.com/applandinc/appmap-agent-js/commit/1b424872dcbcac6bd54e8106f3980663f6f9d8a1))


### Performance Improvements

* lightweight source mapping ([5f057f9](https://github.com/applandinc/appmap-agent-js/commit/5f057f9186c54a3789da12e204beb6cbfe544dd3))
* load sources in the backend ([521b293](https://github.com/applandinc/appmap-agent-js/commit/521b293154607259f9ce640a6c9b05383abbceb1))

# [11.5.0](https://github.com/applandinc/appmap-agent-js/compare/v11.4.0...v11.5.0) (2022-09-14)


### Bug Fixes

* account for file changes between fs calls ([8fb5629](https://github.com/applandinc/appmap-agent-js/commit/8fb5629e2cd06d62384905b9b8d09da3bf6851be))
* avoid calling getters during serialization ([7a23367](https://github.com/applandinc/appmap-agent-js/commit/7a23367254de55a8c4d2e1d0a1eef28e247c55bc))


### Features

* re-enable support for node 17 ([e554d6e](https://github.com/applandinc/appmap-agent-js/commit/e554d6ead0040771cc799c5e8804799fef7a9bb3))


### Performance Improvements

* shorthand for begin/end group event pair ([cf04077](https://github.com/applandinc/appmap-agent-js/commit/cf0407792810a48490c01cb357ae323e0e367b5a))

# [11.4.0](https://github.com/applandinc/appmap-agent-js/compare/v11.3.0...v11.4.0) (2022-09-10)


### Features

* support node18 ([caca2a4](https://github.com/applandinc/appmap-agent-js/commit/caca2a47a66c423ace3fa847f6da5c85ba2e20b8))

# [11.3.0](https://github.com/applandinc/appmap-agent-js/compare/v11.2.0...v11.3.0) (2022-09-09)


### Bug Fixes

* add body to manufactured http events for completion ([b3b05cf](https://github.com/applandinc/appmap-agent-js/commit/b3b05cfeda3615e3ea163853b9ef24d0f550a642))
* adhere to the appmap spec for error format ([3ee5da4](https://github.com/applandinc/appmap-agent-js/commit/3ee5da433fde3eecbeabc1a27517b709db42d469))
* conform to appmap spec for metadata git ([e524791](https://github.com/applandinc/appmap-agent-js/commit/e524791644ff8f2f9b102905416d1064456ecca0))
* group frame in trace post-processing ([b3fbe60](https://github.com/applandinc/appmap-agent-js/commit/b3fbe60defaa98e4dd1a39d8a1cf250f3780ffd1))
* handle http headers which are not strings ([499d204](https://github.com/applandinc/appmap-agent-js/commit/499d2040cd0fb9a3b79d1d22690cf1534614a84d))
* insert symbolic link instead of copying main file ([b905dba](https://github.com/applandinc/appmap-agent-js/commit/b905dbada87ff7c96029f91638e298a97234ccc1)), closes [/github.com/vercel/next.js/blob/7e5cb510c4155572d0b251db34845d34fd078480/packages/next/lib/get-project-dir.ts#L3](https://github.com//github.com/vercel/next.js/blob/7e5cb510c4155572d0b251db34845d34fd078480/packages/next/lib/get-project-dir.ts/issues/L3)
* make sure all payload field satisfy the schema ([8d28927](https://github.com/applandinc/appmap-agent-js/commit/8d289272ccf2796599416002dbb1db30efca76ee))
* make sure http response status is in the right format ([96bbcde](https://github.com/applandinc/appmap-agent-js/commit/96bbcdecb275f18e02207a7fc89aa07424cd1709))
* more lenient monkey-patching ([cb392b3](https://github.com/applandinc/appmap-agent-js/commit/cb392b3d3305580cc2812d633b8a82e7f850f72c))
* move recording of server side request to capture initial event ([cdf65c1](https://github.com/applandinc/appmap-agent-js/commit/cdf65c1dd11f8a58285fa1aca96d30d3db30d3a1))
* no longer overwrite configuration.log.level with error ([61d67c7](https://github.com/applandinc/appmap-agent-js/commit/61d67c77e6492e67902709852e059d8d691e8464))
* properly report unknown configuration field ([1728c56](https://github.com/applandinc/appmap-agent-js/commit/1728c56a7d7d6ad04070ae3c27ff2f1f7360f727))
* show the children of excluded functions ([c41b3ae](https://github.com/applandinc/appmap-agent-js/commit/c41b3ae8f3f852cf38bcc81a7748d347893c2e8f))
* source-map is not a dev-only module ([fa278b8](https://github.com/applandinc/appmap-agent-js/commit/fa278b81b1e7f8bb1b7352f889e854b7699a2dcd))


### Features

* remove recording methods from the API ([aa85b7d](https://github.com/applandinc/appmap-agent-js/commit/aa85b7ded9bb3e54f203906e46c287481f8552cb))
* support eval instrumentation ([02821b1](https://github.com/applandinc/appmap-agent-js/commit/02821b1190d78eee6c8d12602d0548636254562f))
* write appmaps with formatted json ([28b1df0](https://github.com/applandinc/appmap-agent-js/commit/28b1df0b8e19b0eb66e6cfbad6c48348d4d7577d))

# [11.2.0](https://github.com/applandinc/appmap-agent-js/compare/v11.1.0...v11.2.0) (2022-08-16)


### Features

* add specific serialization data for array and hash ([49da5d4](https://github.com/applandinc/appmap-agent-js/commit/49da5d40c9b3e802ba39921ec6a51de6c139a698))
* capture http response body ([a6f3ffe](https://github.com/applandinc/appmap-agent-js/commit/a6f3ffe622d36eeb9c97e61a0e9bc0824389ae2c))
* generate 1.8.0 appmaps ([a931920](https://github.com/applandinc/appmap-agent-js/commit/a931920986a17cf0af546a998b68a89b992bf773))

# [11.1.0](https://github.com/applandinc/appmap-agent-js/compare/v11.0.0...v11.1.0) (2022-07-04)


### Features

* always append the recorder name to the output directory ([aff3ab1](https://github.com/applandinc/appmap-agent-js/commit/aff3ab1b836ae30899c93d242821dd036c1c5864))

# [11.0.0](https://github.com/applandinc/appmap-agent-js/compare/v10.1.0...v11.0.0) (2022-06-22)


### Bug Fixes

* sanitize language version before passing it to acorn ([2595030](https://github.com/applandinc/appmap-agent-js/commit/2595030e3d0074c4666a79bbe1d464161a82ac3f))
* support extension of unrecognized configuration field ([8ee69b6](https://github.com/applandinc/appmap-agent-js/commit/8ee69b6f6d8f4fb46763ebd718d91a39d1eda4e8))
* use more robust import of acorn ([e6b6e2d](https://github.com/applandinc/appmap-agent-js/commit/e6b6e2d9f2ca8ab1a8c9d10c4a001c0426320baf))


### Features

* allow extra root properties in configuration file ([3cbcec0](https://github.com/applandinc/appmap-agent-js/commit/3cbcec0369a6bd06499779116906bd60542df0a1))
* more lenient language and engine configuration field ([f9eef3d](https://github.com/applandinc/appmap-agent-js/commit/f9eef3da03ea3397d0370f84b237910668baede6))
* support only string format for engine config field ([838464e](https://github.com/applandinc/appmap-agent-js/commit/838464e01f0f7d259701410137ab840ca3559c33))
* use appmap_dir and appmap_file instead of output config field ([bcad7b7](https://github.com/applandinc/appmap-agent-js/commit/bcad7b7b2b07bd558375a4421db510d517d7b6d0))
* use the constant javascript string for language's config field ([c28c273](https://github.com/applandinc/appmap-agent-js/commit/c28c27372e91600e120e9603cd35f8924e82bc61))
* whitelist some external but expected root config properties ([ddbb914](https://github.com/applandinc/appmap-agent-js/commit/ddbb9140a0b4a08109e06460484e4efa7f499da1))


### BREAKING CHANGES

* The output configuration field is no longer recognized.
* It is no longer possible to provide a custom extension 
for appmap files.
* name-version object format for engine configuration 
field is no longer supported
* the agent will throw an error if the language 
configuration field is anything else than 'javascript'
* It is no longer possible to tell acorn to parse the 
code to be instrumented as a particular ecmascript version. Instead, we 
now always use the latest version. This should not cause problems 
because ecmascript is backward-compatible.

# [10.1.0](https://github.com/applandinc/appmap-agent-js/compare/v10.0.1...v10.1.0) (2022-06-07)


### Bug Fixes

* add missing separator in appmap path ([8dedccf](https://github.com/applandinc/appmap-agent-js/commit/8dedccffea718da6aae7e1a1443f199de27d277d))
* verify that toString method returned a string ([ea17330](https://github.com/applandinc/appmap-agent-js/commit/ea1733095536ecee793c8029d46844632d7a5084))


### Features

* add log file as configuration option ([b8551cc](https://github.com/applandinc/appmap-agent-js/commit/b8551ccf85e1312fbcafabdec535e0848dd50277))
* support top-level await in modules ([60ee6e6](https://github.com/applandinc/appmap-agent-js/commit/60ee6e64355556962fddbdddd31d34e0310872b5))

## [10.0.1](https://github.com/applandinc/appmap-agent-js/compare/v10.0.0...v10.0.1) (2022-02-18)


### Bug Fixes

* use write instead of end to show results ([af3235f](https://github.com/applandinc/appmap-agent-js/commit/af3235fc09ef495969be845a887f233bb6273cef))

# [10.0.0](https://github.com/applandinc/appmap-agent-js/compare/v9.4.4...v10.0.0) (2022-02-11)


### Bug Fixes

* use static hook name ([9931785](https://github.com/applandinc/appmap-agent-js/commit/9931785593584f7027848b20a5b0a1a2d017aedf))


### Features

* add recording methods to recorder api ([2fcebda](https://github.com/applandinc/appmap-agent-js/commit/2fcebda1aeadbf74f4ce8a262672561f8ec2e7ee))
* rename some API methods ([61560d4](https://github.com/applandinc/appmap-agent-js/commit/61560d42c4280be2bc4e39da99cee05c320f8c4b))
* tweak the API and update the reference doc ([c518b17](https://github.com/applandinc/appmap-agent-js/commit/c518b1712838bc4518657c063358d5b5329a2b91))


### BREAKING CHANGES

* createAppmap becomes createAppMap, appmap.startTrack becomes appmap.startRecording, and appmap.startTrack becomes appmap.stopRecording

## [9.4.4](https://github.com/applandinc/appmap-agent-js/compare/v9.4.3...v9.4.4) (2022-01-29)


### Bug Fixes

* bin file is now commonjs instead of native module ([f729934](https://github.com/applandinc/appmap-agent-js/commit/f729934a17301d10c495998077e50086895b7e1f))
* rename noop engine into engines in package.json ([9d05d81](https://github.com/applandinc/appmap-agent-js/commit/9d05d81b79cec869283d09e778a56405ac1e6c3e))

## [9.4.3](https://github.com/applandinc/appmap-agent-js/compare/v9.4.2...v9.4.3) (2022-01-26)


### Bug Fixes

* add glob to dependencies instead of devDependencies ([2317abc](https://github.com/applandinc/appmap-agent-js/commit/2317abc2f812c62e9a5254dd9412c0ae78b31d44))

## [9.4.2](https://github.com/applandinc/appmap-agent-js/compare/v9.4.1...v9.4.2) (2022-01-21)


### Bug Fixes

* Improved node version compatibility ([646692e](https://github.com/applandinc/appmap-agent-js/commit/646692e4bdee2ea4938689ddd4b021960b795e50))

## [9.4.1](https://github.com/applandinc/appmap-agent-js/compare/v9.4.0...v9.4.1) (2022-01-19)


### Bug Fixes

* Fix the version constraints used by status ([dfd2514](https://github.com/applandinc/appmap-agent-js/commit/dfd2514f93db7fe06901f7f1cc85868dc0518877))

# [9.4.0](https://github.com/applandinc/appmap-agent-js/compare/v9.3.1...v9.4.0) (2022-01-17)


### Bug Fixes

* handles absolute windows path in `sources` of source maps ([a4c89a3](https://github.com/applandinc/appmap-agent-js/commit/a4c89a36f4cd6bb69bf88ac2161edf4d781e0d00))


### Features

* commands are now executed via a shell rather than directly spawned ([9e8cfa1](https://github.com/applandinc/appmap-agent-js/commit/9e8cfa1dabf504927b44a5a0c071c924fd0338d5))

## [9.3.1](https://github.com/applandinc/appmap-agent-js/compare/v9.3.0...v9.3.1) (2022-01-12)


### Bug Fixes

* Add semver to package.json ([c81163d](https://github.com/applandinc/appmap-agent-js/commit/c81163dc3ddeafcd6c961369e752bc57acd10611))
* Tighten node version restrictions ([f45700f](https://github.com/applandinc/appmap-agent-js/commit/f45700f98af1ae3116c748725f6bbb18b396f89e))

# [9.3.0](https://github.com/applandinc/appmap-agent-js/compare/v9.2.0...v9.3.0) (2022-01-12)


### Features

* do not crash on invalid package.json ([7926926](https://github.com/applandinc/appmap-agent-js/commit/7926926889095bf1c20dfce681fb05fc2706d697))

# [9.2.0](https://github.com/applandinc/appmap-agent-js/compare/v9.1.2...v9.2.0) (2022-01-11)


### Features

* proper support for extension-less node binary files in windows ([3a5eaca](https://github.com/applandinc/appmap-agent-js/commit/3a5eaca7fdfc21dbe1cd6616482b21efbce3612e))

## [9.1.2](https://github.com/applandinc/appmap-agent-js/compare/v9.1.1...v9.1.2) (2022-01-10)


### Bug Fixes

* Allow CLI installation on Windows ([8001465](https://github.com/applandinc/appmap-agent-js/commit/80014653265de676a850f4ef7f9e5ba5a0c25edc))

## [9.1.1](https://github.com/applandinc/appmap-agent-js/compare/v9.1.0...v9.1.1) (2022-01-09)


### Bug Fixes

* failing assertion on identity of emit method ([cd7817d](https://github.com/applandinc/appmap-agent-js/commit/cd7817dee574b4447322c778fa57c5fd823b70c1))


### Performance Improvements

* avoid installing the agent twise in npm system test ([b412f40](https://github.com/applandinc/appmap-agent-js/commit/b412f40bb97c3cb987423fc79c4e1db51d976d69))

# [9.1.0](https://github.com/applandinc/appmap-agent-js/compare/v9.0.1...v9.1.0) (2022-01-07)


### Features

* change user-provided label format in comments ([0ef6534](https://github.com/applandinc/appmap-agent-js/commit/0ef65349fd2661fbf39be799d69c5dae4629816b))

## [9.0.1](https://github.com/applandinc/appmap-agent-js/compare/v9.0.0...v9.0.1) (2022-01-06)


### Bug Fixes

* node --require needs explicit dot in relative paths ([579ccdf](https://github.com/applandinc/appmap-agent-js/commit/579ccdf659784c2725a737590a413af5230a098c))

# [9.0.0](https://github.com/applandinc/appmap-agent-js/compare/v8.8.4...v9.0.0) (2022-01-06)


### Features

* windows-support ([70d2c66](https://github.com/applandinc/appmap-agent-js/commit/70d2c669772948ce91b0149bde77d75ba786d30f))


### BREAKING CHANGES

* Commands are no longer interpreted using `/bin/sh`. Rather, they are understood as simply the path / name of an executable followed by its arguments. This the easiest and most portable approach and it should be sufficient for most cases. However, in the future we might want to use the npm approach where commands are interpreted by `/bin/sh` on unix platforms and `cmd.exe` on Windows platforms. We could also be using PowerShell on Windows and interpret the command as shell programs across all platforms.

## [8.8.4](https://github.com/applandinc/appmap-agent-js/compare/v8.8.3...v8.8.4) (2022-01-04)


### Bug Fixes

* Get rid of top-level awaits ([48d03b0](https://github.com/applandinc/appmap-agent-js/commit/48d03b007ef45a688f58c7979162215be058e897))

## [8.8.3](https://github.com/applandinc/appmap-agent-js/compare/v8.8.2...v8.8.3) (2021-12-24)


### Bug Fixes

* handle manufactured apply events which have a null location ([2f07433](https://github.com/applandinc/appmap-agent-js/commit/2f0743317adde4a020de9adc8bf94460d7648630))

## [8.8.2](https://github.com/applandinc/appmap-agent-js/compare/v8.8.1...v8.8.2) (2021-12-15)


### Bug Fixes

* default exclusion list ([fde422f](https://github.com/applandinc/appmap-agent-js/commit/fde422ffe5ef70b552c255a2843748baf3591e1f))

## [8.8.1](https://github.com/applandinc/appmap-agent-js/compare/v8.8.0...v8.8.1) (2021-12-08)


### Bug Fixes

* avoid recording some http requests from the agent ([d769574](https://github.com/applandinc/appmap-agent-js/commit/d769574fc9841d8f8468de4b9d5322c3e15c0ea4))

# [8.8.0](https://github.com/applandinc/appmap-agent-js/compare/v8.7.1...v8.8.0) (2021-12-08)


### Features

* additional logging for diagnosing instrumentation filtering ([d73d39a](https://github.com/applandinc/appmap-agent-js/commit/d73d39a7d91d69ed43f79c952318570e9d507656))

## [8.7.1](https://github.com/applandinc/appmap-agent-js/compare/v8.7.0...v8.7.1) (2021-12-07)


### Bug Fixes

* sanitize basename before writting files ([5f93d3e](https://github.com/applandinc/appmap-agent-js/commit/5f93d3e33ff28c7a7a9223f25eb35a7be27ea82c))

# [8.7.0](https://github.com/applandinc/appmap-agent-js/compare/v8.6.4...v8.7.0) (2021-12-06)


### Bug Fixes

* more robust source location serialization via JSON ([8e04712](https://github.com/applandinc/appmap-agent-js/commit/8e047128239f77ecbf4f1bffa7a91ca303f01bc3))


### Features

* enable all hooks by default ([04a9940](https://github.com/applandinc/appmap-agent-js/commit/04a99408da8233d760f35f89daead4b805cfd453))

## [8.6.4](https://github.com/applandinc/appmap-agent-js/compare/v8.6.3...v8.6.4) (2021-12-06)


### Bug Fixes

* better handle location urls which already have a hash segment ([6374195](https://github.com/applandinc/appmap-agent-js/commit/6374195113e87587a64a720979f0002b737af410))

## [8.6.3](https://github.com/applandinc/appmap-agent-js/compare/v8.6.2...v8.6.3) (2021-12-04)


### Bug Fixes

* log instead of crash on location url which contain hash ([5dd1c4b](https://github.com/applandinc/appmap-agent-js/commit/5dd1c4b3b28a8baaf52ecb36437636d9f5d543df))

## [8.6.2](https://github.com/applandinc/appmap-agent-js/compare/v8.6.1...v8.6.2) (2021-12-04)


### Bug Fixes

* log instead of crashing on unrecoverable parsing error ([3b16f41](https://github.com/applandinc/appmap-agent-js/commit/3b16f41f513bb652626c0d344a5f3ac90489f580))

## [8.6.1](https://github.com/applandinc/appmap-agent-js/compare/v8.6.0...v8.6.1) (2021-12-04)


### Bug Fixes

* consistent default import of commonjs modules ([8c237b2](https://github.com/applandinc/appmap-agent-js/commit/8c237b234d9e3501750bcaaa645933df298c8e7b))

# [8.6.0](https://github.com/applandinc/appmap-agent-js/compare/v8.5.0...v8.6.0) (2021-12-03)


### Features

* more advanced function filtering ([448d80f](https://github.com/applandinc/appmap-agent-js/commit/448d80f014ca01d7cea8a353ea81fb758fb37de3))
* switch default collapse-package-hiearchy to false ([a82dcae](https://github.com/applandinc/appmap-agent-js/commit/a82dcaed2494d688d5f220f211ea64ab44b4e630))

# [8.5.0](https://github.com/applandinc/appmap-agent-js/compare/v8.4.4...v8.5.0) (2021-12-02)


### Features

* add labels to functions in classmap ([f4a2939](https://github.com/applandinc/appmap-agent-js/commit/f4a2939cbb6cdef1a742d62474639459ae25ea11))

## [8.4.4](https://github.com/applandinc/appmap-agent-js/compare/v8.4.3...v8.4.4) (2021-12-02)


### Bug Fixes

* Correct default config ([af9916c](https://github.com/applandinc/appmap-agent-js/commit/af9916c807aa2602dfe8c1cb4030f7edf42bb7b7))
* Honor backpressure in init ([82466c2](https://github.com/applandinc/appmap-agent-js/commit/82466c21ed6729c908d97d29497f84d8835d3d53))

## [8.4.3](https://github.com/applandinc/appmap-agent-js/compare/v8.4.2...v8.4.3) (2021-11-26)


### Bug Fixes

* Ensure full result gets written ([0692a2e](https://github.com/applandinc/appmap-agent-js/commit/0692a2ea6b34c251adfd7a76a4adf54d7bfcbd19))

## [8.4.2](https://github.com/applandinc/appmap-agent-js/compare/v8.4.1...v8.4.2) (2021-11-25)


### Bug Fixes

* Fix the status subcommand route ([3efa57d](https://github.com/applandinc/appmap-agent-js/commit/3efa57d7669623bfbeffd65b72fd22fe3f252e63))

## [8.4.1](https://github.com/applandinc/appmap-agent-js/compare/v8.4.0...v8.4.1) (2021-11-24)


### Bug Fixes

* Make the status subcommand available ([ea2d3b5](https://github.com/applandinc/appmap-agent-js/commit/ea2d3b529c4dac64d47bace411bdec831b3f88f7))

# [8.4.0](https://github.com/applandinc/appmap-agent-js/compare/v8.3.0...v8.4.0) (2021-11-24)


### Features

* Add init subcommand ([7db6b3e](https://github.com/applandinc/appmap-agent-js/commit/7db6b3e808b8dbdc00ec48533fa8651e21032b75))
* Add status subcommand ([04eea09](https://github.com/applandinc/appmap-agent-js/commit/04eea0987fbc9661521acb2869cfa9ea5e9aa5ae))

# [8.3.0](https://github.com/applandinc/appmap-agent-js/compare/v8.2.5...v8.3.0) (2021-11-19)


### Features

* add collapse-package-hierarchy configuration field ([1b07687](https://github.com/applandinc/appmap-agent-js/commit/1b07687ee4a6f4c130084ebf115dbead8cc7cec2))

## [8.2.5](https://github.com/applandinc/appmap-agent-js/compare/v8.2.4...v8.2.5) (2021-11-17)


### Bug Fixes

* build now start from scratch dist folder ([2520cf7](https://github.com/applandinc/appmap-agent-js/commit/2520cf7d0fef6d0f5f9b533e930fc4eca5c16050))

## [8.2.4](https://github.com/applandinc/appmap-agent-js/compare/v8.2.3...v8.2.4) (2021-11-17)


### Bug Fixes

* warn instead of crash when fail to parse git description ([431ca41](https://github.com/applandinc/appmap-agent-js/commit/431ca415cc189e6c158034223dc2cbdb4b1b4dbe))

## [8.2.3](https://github.com/applandinc/appmap-agent-js/compare/v8.2.2...v8.2.3) (2021-11-16)


### Bug Fixes

* add license field ([1d00be9](https://github.com/applandinc/appmap-agent-js/commit/1d00be997d75c37ff6999b23f48d3517111555fa))

## [8.2.2](https://github.com/applandinc/appmap-agent-js/compare/v8.2.1...v8.2.2) (2021-11-15)


### Bug Fixes

* add sometimes missing function in classmap ([696741e](https://github.com/applandinc/appmap-agent-js/commit/696741e85e7b93c93618882697ee2de88ea6ca7c))

## [8.2.1](https://github.com/applandinc/appmap-agent-js/compare/v8.2.0...v8.2.1) (2021-11-12)


### Bug Fixes

* tweak some shell commands ([e9fd83d](https://github.com/applandinc/appmap-agent-js/commit/e9fd83dcc4bb25f8973069304d2f09dd1e19cc4a))

# [8.2.0](https://github.com/applandinc/appmap-agent-js/compare/v8.1.1...v8.2.0) (2021-11-12)


### Features

* pruning now acts on classes and packages. ([23c2207](https://github.com/applandinc/appmap-agent-js/commit/23c2207041bc84af348c3fa4feb5d531243d2a8b))

## [8.1.1](https://github.com/applandinc/appmap-agent-js/compare/v8.1.0...v8.1.1) (2021-11-12)


### Bug Fixes

* support for relative paths in source map data url ([8b2c082](https://github.com/applandinc/appmap-agent-js/commit/8b2c082831758cb74454a9a3886973aa2ea92b09))

# [8.1.0](https://github.com/applandinc/appmap-agent-js/compare/v8.0.1...v8.1.0) (2021-11-12)


### Features

* improved exclusion mechanism ([b14e965](https://github.com/applandinc/appmap-agent-js/commit/b14e965baf1645762c9bd16a57c6be655274ec98))
* path package specifier is now recursive by default ([cbf6b34](https://github.com/applandinc/appmap-agent-js/commit/cbf6b341946a742cadab680b804615f03003ed42))
* remove setup command from help message ([669fc75](https://github.com/applandinc/appmap-agent-js/commit/669fc754b8bd68e3820896d348b65f67a18ca210))

## [8.0.1](https://github.com/applandinc/appmap-agent-js/compare/v8.0.0...v8.0.1) (2021-11-12)


### Bug Fixes

* only print ignore message when loader is enabled ([86b36c4](https://github.com/applandinc/appmap-agent-js/commit/86b36c4d3664a86c09fba6519322da8155b01cd8))

# [8.0.0](https://github.com/applandinc/appmap-agent-js/compare/v7.3.1...v8.0.0) (2021-11-11)


### Features

* scenario now discriminate against dedicated key rather than name ([f2ff33b](https://github.com/applandinc/appmap-agent-js/commit/f2ff33bb95c0e258e98994c56616f75456aac003))


### BREAKING CHANGES

* Scenarios are now entered as an object rather than an array. The scenario configuration field is a regular expression that is tested agaisnt the keys of this object. Before it was tested against the name of the app (the name configuration field recently became the name of the app instead of the name of the appmap) which did not make much sense.

## [7.3.1](https://github.com/applandinc/appmap-agent-js/compare/v7.3.0...v7.3.1) (2021-11-11)


### Bug Fixes

* avoid npx to launch test-turtle ([13a350e](https://github.com/applandinc/appmap-agent-js/commit/13a350eb23c1a026937f1f57aece0f19a56207d7))
* node requirement ([cc8466e](https://github.com/applandinc/appmap-agent-js/commit/cc8466e44419a6d3d0c66ca4f4a5ee2201e073a3))

# [7.3.0](https://github.com/applandinc/appmap-agent-js/compare/v7.2.0...v7.3.0) (2021-11-11)


### Features

* support for more CLI named argument ([d1428e3](https://github.com/applandinc/appmap-agent-js/commit/d1428e3536c6dbe7f5cd839146860480493c089b))

# [7.2.0](https://github.com/applandinc/appmap-agent-js/compare/v7.1.2...v7.2.0) (2021-11-11)


### Features

* support --help and --version aliases ([0bd7f74](https://github.com/applandinc/appmap-agent-js/commit/0bd7f74b1f1fd12e16ef89a2a062334606bd942e))

## [7.1.2](https://github.com/applandinc/appmap-agent-js/compare/v7.1.1...v7.1.2) (2021-11-11)


### Bug Fixes

* now executable help prints help instead of version ([923fadc](https://github.com/applandinc/appmap-agent-js/commit/923fadcecc2190e0f204599d67d07651525b7958))

## [7.1.1](https://github.com/applandinc/appmap-agent-js/compare/v7.1.0...v7.1.1) (2021-11-10)


### Bug Fixes

* files are not instrumented if not listed in packages ([ef7d9a0](https://github.com/applandinc/appmap-agent-js/commit/ef7d9a07c01e2492d046675782cf1a2385920bc7))

# [7.1.0](https://github.com/applandinc/appmap-agent-js/compare/v7.0.0...v7.1.0) (2021-11-10)


### Features

* help and version in CLI ([3bb79b2](https://github.com/applandinc/appmap-agent-js/commit/3bb79b22563bc27cdbaffb738021d12dae1930c8))

# [7.0.0](https://github.com/applandinc/appmap-agent-js/compare/v6.7.0...v7.0.0) (2021-11-10)


### Bug Fixes

* standardized some configuration fields ([f8b2c35](https://github.com/applandinc/appmap-agent-js/commit/f8b2c35da3e0fa47df45857f0def10513f3fb936))


### BREAKING CHANGES

* Configuration fields `app` and `name` are respectively renamed to `name` and `map-name`.

# [6.7.0](https://github.com/applandinc/appmap-agent-js/compare/v6.6.0...v6.7.0) (2021-11-10)


### Features

* more lenient source map data url parsing ([fb57927](https://github.com/applandinc/appmap-agent-js/commit/fb579274d46a748dfa4cdc35bc162d63d5f3e2f2))

# [6.6.0](https://github.com/applandinc/appmap-agent-js/compare/v6.5.0...v6.6.0) (2021-11-10)


### Features

* add aliases to CLI ([e2ea710](https://github.com/applandinc/appmap-agent-js/commit/e2ea7100dd8940e93d5b781d2b9e448824939f5c))
* dynamic default value for output directory ([1300f84](https://github.com/applandinc/appmap-agent-js/commit/1300f84b62dd4c072bffdea3ce4a9861fcaff098))

# [6.5.0](https://github.com/applandinc/appmap-agent-js/compare/v6.4.0...v6.5.0) (2021-11-09)


### Features

* add default recorder ([4e38676](https://github.com/applandinc/appmap-agent-js/commit/4e38676c2a942665ef09d05ef38d8ce5682ea631))

# [6.4.0](https://github.com/applandinc/appmap-agent-js/compare/v6.3.3...v6.4.0) (2021-11-09)


### Bug Fixes

* cwd is now attached to command rather than command-options ([add102f](https://github.com/applandinc/appmap-agent-js/commit/add102f56e2dc6f0d8d412d27d6c62dd2fd17bac))
* tweak default configuration fields ([7eff84c](https://github.com/applandinc/appmap-agent-js/commit/7eff84c8514b61946e974c3c54b9b7cc200178eb))


### Features

* intercept-track-port now accepts a regular expression ([92c583e](https://github.com/applandinc/appmap-agent-js/commit/92c583e8679065cad46073cbe63963187d1a6a77))
* support input command as positional arguments ([80b365a](https://github.com/applandinc/appmap-agent-js/commit/80b365aa6c84aaab888e60b0f77758e228cbd647))
* warning instead of failure on missing sql npm package ([2c5e5eb](https://github.com/applandinc/appmap-agent-js/commit/2c5e5eb3011607f55192acbaa243331c2c6b4429))

## [6.3.3](https://github.com/applandinc/appmap-agent-js/compare/v6.3.2...v6.3.3) (2021-11-08)


### Bug Fixes

* support for new node module loader hooks ([99f0d9e](https://github.com/applandinc/appmap-agent-js/commit/99f0d9ebd0613c000f4f56b676988fa97ed7e859))

## [6.3.2](https://github.com/applandinc/appmap-agent-js/compare/v6.3.1...v6.3.2) (2021-11-02)


### Bug Fixes

* valid urls for manufactured events ([95eb0b7](https://github.com/applandinc/appmap-agent-js/commit/95eb0b7210eae5e0e7dc28b5ddaa6eff805b0dbf))

## [6.3.1](https://github.com/applandinc/appmap-agent-js/compare/v6.3.0...v6.3.1) (2021-11-02)


### Bug Fixes

* no longer crash on package url other than 'data:' or 'file:' ([6233055](https://github.com/applandinc/appmap-agent-js/commit/623305553fd6718898955d3e26fcb8d2f4e86103))
* warning instead of failing upon http activity after closing ([bbc3aca](https://github.com/applandinc/appmap-agent-js/commit/bbc3aca85f6ffc9df7697f5d1f1a211c81091e38))

# [6.3.0](https://github.com/applandinc/appmap-agent-js/compare/v6.2.0...v6.3.0) (2021-11-02)


### Features

* check mocha version before yielding control to mocha cli ([3bfb515](https://github.com/applandinc/appmap-agent-js/commit/3bfb515564c28e39b5671c0333e4849f7e60f101))

# [6.2.0](https://github.com/applandinc/appmap-agent-js/compare/v6.1.0...v6.2.0) (2021-11-01)


### Features

* support for data url in source maps ([ea52da2](https://github.com/applandinc/appmap-agent-js/commit/ea52da2758d0190ac652a5c06a69070265912885))

# [6.1.0](https://github.com/applandinc/appmap-agent-js/compare/v6.0.0...v6.1.0) (2021-10-29)


### Features

* remove constraint to share recorder accross selected scenario ([aa0f0c7](https://github.com/applandinc/appmap-agent-js/commit/aa0f0c786fcbdcb59efe359d15959c2677786f7c))

# [6.0.0](https://github.com/applandinc/appmap-agent-js/compare/v5.2.2...v6.0.0) (2021-10-28)


### Features

* revamp scenario feature in the configuration ([e31411e](https://github.com/applandinc/appmap-agent-js/commit/e31411e0dc9553ed2ecf25b30acecd2820bbe9c8))


### BREAKING CHANGES

* Revamped scenario feature in the configuration.
The configuration format accepts a command field (parsed arrays are no 
longer supported).
Scenarios are just configuration (the fork and spawn format are no 
longer supported).
The mode configuration field has been removed (redundant with the 
recorder field).

## [5.2.2](https://github.com/applandinc/appmap-agent-js/compare/v5.2.1...v5.2.2) (2021-10-25)


### Bug Fixes

* make sure to not access 'this' in child constructors ([4b3969a](https://github.com/applandinc/appmap-agent-js/commit/4b3969aff8f21e7722506e2c41fc10a22bcd2b64))

## [5.2.1](https://github.com/applandinc/appmap-agent-js/compare/v5.2.0...v5.2.1) (2021-10-25)


### Bug Fixes

* use posix-socket-messaging instead of fs.writeSync ([ed2acf7](https://github.com/applandinc/appmap-agent-js/commit/ed2acf74f3aae013aa641e22f101fa8a70a63faf))

# [5.2.0](https://github.com/applandinc/appmap-agent-js/compare/v5.1.2...v5.2.0) (2021-10-24)


### Bug Fixes

* remove files from package.json, use npm ignore instead ([4fb337e](https://github.com/applandinc/appmap-agent-js/commit/4fb337ea96b51533f397f605a722872db842a883))


### Features

* in case of closure source map location miss check one column after ([292c1d2](https://github.com/applandinc/appmap-agent-js/commit/292c1d232c0ad7c1da882f9461402cb663757278))

## [5.1.2](https://github.com/applandinc/appmap-agent-js/compare/v5.1.1...v5.1.2) (2021-10-24)


### Bug Fixes

* code entities in objects properties are no longer discarded ([b5d3b08](https://github.com/applandinc/appmap-agent-js/commit/b5d3b08737dcbbedb0ce1edb26bc31b09d9ac7e2))

## [5.1.1](https://github.com/applandinc/appmap-agent-js/compare/v5.1.0...v5.1.1) (2021-10-24)


### Bug Fixes

* use mozilla's source-map@0.6.1 instead of (flawed) node's builtin ([72cc494](https://github.com/applandinc/appmap-agent-js/commit/72cc494fca270f283dd09944d308f10263a146a3))

# [5.1.0](https://github.com/applandinc/appmap-agent-js/compare/v5.0.0...v5.1.0) (2021-10-22)


### Bug Fixes

* normalization path now handles properly multiple '..' in succession ([4d70273](https://github.com/applandinc/appmap-agent-js/commit/4d70273f408a99ba869a74670c1a4a6ae10e1fc2))


### Features

* recovery when failing to read files related to source map ([2decdeb](https://github.com/applandinc/appmap-agent-js/commit/2decdeb5f25751168e16308afd9e0c64fe3fbc2b))

# [5.0.0](https://github.com/applandinc/appmap-agent-js/compare/v4.0.1...v5.0.0) (2021-10-22)


### Features

* change ([40e4e20](https://github.com/applandinc/appmap-agent-js/commit/40e4e20300c85c956bcd0c6d11b6ff453dc6d64a))
* source map support ([7b7cd96](https://github.com/applandinc/appmap-agent-js/commit/7b7cd96915a23b4da4c80b8210cbb94921faef44))


### BREAKING CHANGES

* configuration field 'packages' acts on sources instead 
on generated javascript code
* change configuration field `source` into 
`inline-source`

## [4.0.1](https://github.com/applandinc/appmap-agent-js/compare/v4.0.0...v4.0.1) (2021-10-08)


### Bug Fixes

* integration tests now fail on promise rejection ([4f2c03c](https://github.com/applandinc/appmap-agent-js/commit/4f2c03c8b0ee49011e6eff9127998cef4d9f6e22))

# [4.0.0](https://github.com/applandinc/appmap-agent-js/compare/v3.2.0...v4.0.0) (2021-10-08)


### Bug Fixes

* abandon unknown group strategy, with a slightly more complex instrumentation correct groups can be retrieved ([2883230](https://github.com/applandinc/appmap-agent-js/commit/2883230dbe07f15b59092080be5eacafc0210a6c))
* adapt hook query to new sync api ([8c04898](https://github.com/applandinc/appmap-agent-js/commit/8c048986245d274ff571456c2fbbd873ffeb20d5))
* add @appland/appmap-validate in production dependencies ([60b96dc](https://github.com/applandinc/appmap-agent-js/commit/60b96dc82fa46f55ab454d851cc11319a7f88fa9))
* add before/after events in each track's slice ([0309e07](https://github.com/applandinc/appmap-agent-js/commit/0309e07d3b144e7a5482d30cb0b7473541030d98))
* add lib/abomination.js file in npm package ([4c08891](https://github.com/applandinc/appmap-agent-js/commit/4c08891df91908364faea0ef9c874665cd781c83))
* add missing storables in some request responses ([76930f7](https://github.com/applandinc/appmap-agent-js/commit/76930f7144b60af2971f427b448d641a8b063487))
* add parameters into event.message instead of event.http_server_request.paramaters ([8cb2c2d](https://github.com/applandinc/appmap-agent-js/commit/8cb2c2d95bd145cbfcb8a1c1a207b5c93e191eb8))
* add shallow information to message schema ([671bf9d](https://github.com/applandinc/appmap-agent-js/commit/671bf9dd3dc77c46f6f8477834fa18693981ba57))
* add shallow to message >> trace >> file ([6cf4725](https://github.com/applandinc/appmap-agent-js/commit/6cf4725b5a1fb171d995b0a0412f4592c8364b86))
* basic mistakes in bin ([67ecf29](https://github.com/applandinc/appmap-agent-js/commit/67ecf29d8f625e1bc4a39ae84e795f20ceb97072))
* better adhere to specification for http hooking ([def6c04](https://github.com/applandinc/appmap-agent-js/commit/def6c04bbb4ec834de19bb15a2966f3b442b1659))
* better adhere to the doc ([cdff50c](https://github.com/applandinc/appmap-agent-js/commit/cdff50c5246b6078f1b13ca3d5f11257760ceaf2))
* better emitter spying which relies on overwritting emit instead of hacky tricks ([1fd4a89](https://github.com/applandinc/appmap-agent-js/commit/1fd4a894dbb63ae4056799824a076f59696d8afa))
* bugs related to integration ([623f667](https://github.com/applandinc/appmap-agent-js/commit/623f667ee421166d819804689dcd5540e6b7ecc9))
* bump to appmap v1.6.0 and truncate value in parameters ([bafab9f](https://github.com/applandinc/appmap-agent-js/commit/bafab9fa8d58d52e073f5dc60f2641df9b1b55af))
* bundle and fork events ([ee9bfd2](https://github.com/applandinc/appmap-agent-js/commit/ee9bfd216742554b20ca09634c9f0303f81e0150))
* continuous indexing ([477892c](https://github.com/applandinc/appmap-agent-js/commit/477892c38fdc496c099854265e63704cf033d198))
* correct a bug in the manufactoring algorithm ([1027446](https://github.com/applandinc/appmap-agent-js/commit/1027446a19ced286ebc02a04853beb6e2f1f2815))
* correct manufactured data for trace completion ([c69534e](https://github.com/applandinc/appmap-agent-js/commit/c69534ea9d8365efd900f5537a0ec676499bfcae))
* correct wrong key for overwritting events ([2ed6675](https://github.com/applandinc/appmap-agent-js/commit/2ed66758b816c065e90b01a8415c1bcafc28586f))
* cwd-agnostique builder ([6e3b820](https://github.com/applandinc/appmap-agent-js/commit/6e3b820839689cc60df5935a734d6b309a2a73dd))
* disable automated asynchronous jump for the time being ([f937971](https://github.com/applandinc/appmap-agent-js/commit/f937971ecc8214cb1e805cf10eb4a14e3bcd7b33))
* don't crash anymore on anonymous names ([9920000](https://github.com/applandinc/appmap-agent-js/commit/99200001161b7b4297fc18a359aab4bf667ed167))
* enable mysql test (another mysql server was running on local system) ([9e3fb06](https://github.com/applandinc/appmap-agent-js/commit/9e3fb066c301cd535db22d2a1fec19fdf88316c2))
* event id now better reflect the timeline ([09aaaae](https://github.com/applandinc/appmap-agent-js/commit/09aaaae79259722c4d965066b32e6b8f59b92ee7))
* fake prompts now works as real prompts ([df09e44](https://github.com/applandinc/appmap-agent-js/commit/df09e446837d95deeb72684412626b4f556c1f34))
* fix and test client component ([ee9957e](https://github.com/applandinc/appmap-agent-js/commit/ee9957e5307df96a0f7aa1ac8a1a0a53ad11cd93))
* fix and test client http2 ([3068dc8](https://github.com/applandinc/appmap-agent-js/commit/3068dc8afa65dbb05eb893d8a8b25c5d80a24e5a))
* fix and test http1 server component ([f815348](https://github.com/applandinc/appmap-agent-js/commit/f8153488e8ab23deb8f48743cad4257c86e33c2a))
* fix and test instrumentation ([83bc534](https://github.com/applandinc/appmap-agent-js/commit/83bc534afaf6a129593f834370801680b7d15d45))
* fix and test interpretation ([fa5563b](https://github.com/applandinc/appmap-agent-js/commit/fa5563b49b4b675faac73d52d812c6d9a3d00c52))
* fix and test tcp server ([e36f370](https://github.com/applandinc/appmap-agent-js/commit/e36f370f58d5de326fd719eae206befe1ec5197d))
* fix bin file ([89cb2ef](https://github.com/applandinc/appmap-agent-js/commit/89cb2ef0dc5f665ba9ab8c9afa55393c93af6141))
* fix corner case where done stuff was marked too early ([40da18b](https://github.com/applandinc/appmap-agent-js/commit/40da18b6eb265a271455646bdac3ac56daf2d4fd))
* flaten protype for backend session's response (support object rest) ([5355aaf](https://github.com/applandinc/appmap-agent-js/commit/5355aafb4d7337780d6715304a2f1154bf3b6c2e))
* force npx mocha to always spawn ([258c0fb](https://github.com/applandinc/appmap-agent-js/commit/258c0fb71ba607b2d88f04e1be66effc12690520))
* function expression without identifier are now correctly marked as anonymous ([ba84081](https://github.com/applandinc/appmap-agent-js/commit/ba84081116015f9157d96248e44124aefacb6277))
* generate warning instead of error when attempting to send a message after session end ([846fc7c](https://github.com/applandinc/appmap-agent-js/commit/846fc7c81ba193301b77c83143f92a575eb6f77c))
* group are now correctly communicated between the hook and the trace ([7a73f5c](https://github.com/applandinc/appmap-agent-js/commit/7a73f5cecd609d27b2601c5b56f07eaaecd6b466))
* group for after await jump is now null instead of invalid ([e00c6d1](https://github.com/applandinc/appmap-agent-js/commit/e00c6d1ca136c406dd9f404c98159b10b3543664))
* handle case where asynchronous id is declared but does not appear ([258b6a7](https://github.com/applandinc/appmap-agent-js/commit/258b6a7c16f280c23bcc6252ffa229dae9a70c5e))
* handle hashbang ([96fe08b](https://github.com/applandinc/appmap-agent-js/commit/96fe08b808b9942fea51987ee72994363ede7746))
* handle manufactured event which has no associated function in the appmap ([afdf81a](https://github.com/applandinc/appmap-agent-js/commit/afdf81a4bf7a118d5c5be2f336b18c54f28cb52c))
* handle the case where events are fired within the initial request event of a server ([1beb685](https://github.com/applandinc/appmap-agent-js/commit/1beb6856e9b79f4e9f0bd1b3a575f9cd9294d3e5))
* http request's message field is now an array of parameter as it should ([70ed1c6](https://github.com/applandinc/appmap-agent-js/commit/70ed1c65f561d6026bce29a33d37afed4a97ed01))
* http server response bundle now encompass all listeners ([2654b7b](https://github.com/applandinc/appmap-agent-js/commit/2654b7bdce9356c7f832190a951a023073cf731f))
* improve transparency of sqlite3 hooks ([4cac0c8](https://github.com/applandinc/appmap-agent-js/commit/4cac0c8ce56011aa2e3c04a82f1dd6c2facca2ed))
* integration ([3ce3d91](https://github.com/applandinc/appmap-agent-js/commit/3ce3d91ecc486f428ab40cbd4ad16aadc7ae536c))
* invalid logging format ([4e77c08](https://github.com/applandinc/appmap-agent-js/commit/4e77c08a1c34709fe8656ad6cd7cbe36678a7d03))
* keep jumps within marker bundles (but remove them bundle is skipped) ([ea304d9](https://github.com/applandinc/appmap-agent-js/commit/ea304d902f39fb92a4c7cc0b7cf6273c39a5a595))
* made event.method_id and event.defined_class match corresponding object in the classMap ([27e1a86](https://github.com/applandinc/appmap-agent-js/commit/27e1a869f89e0e5612ce583d19ebfee01c3030cb))
* make sure groups do not mess up jumps ordering ([6a75df0](https://github.com/applandinc/appmap-agent-js/commit/6a75df029cf24cc3b93d4e2a52f2ba06a0d8db3a))
* minor issues in config questionnaire ([78dd9d9](https://github.com/applandinc/appmap-agent-js/commit/78dd9d90d9578bb605328523fc4aeb2561c1950d))
* more robust and faster manufactoring algorithm ([dee4833](https://github.com/applandinc/appmap-agent-js/commit/dee483307e1f9b729936d7a656613ac2521ea637))
* multiple fixes on instrumentation component, now completely tested ([3799538](https://github.com/applandinc/appmap-agent-js/commit/37995388845d26d4a2de517f8c483d9872421367))
* no longer output callstack frames but a flat list of stack-ordered events ([ddd81df](https://github.com/applandinc/appmap-agent-js/commit/ddd81df358e29669d7546cff2abdd041f3ded0eb))
* now metadata better adheres to appmap spec ([e51e674](https://github.com/applandinc/appmap-agent-js/commit/e51e674598e6e6320ba10f3f63353af7a21144e7))
* numerous fixes on: util, expect, and log ([8703dc6](https://github.com/applandinc/appmap-agent-js/commit/8703dc6a3a876ab39dd25de945080b362f5fd8c7))
* portable path in test ([1f92216](https://github.com/applandinc/appmap-agent-js/commit/1f92216bcf315abd3a6239b806c55b8684f8d76f))
* prevent null values in recording object ([bdf67bc](https://github.com/applandinc/appmap-agent-js/commit/bdf67bc11b0bd625942f1558964b74c85ffe29bb))
* proble with cwd in batch ([1f645d8](https://github.com/applandinc/appmap-agent-js/commit/1f645d84e7861074cbf9afd5b60baf462fc66ad2))
* properly use the fact that it is the module nature and not how it is imported that defines in which cache it will be be placed (cjs vs esm) ([cf5f4e4](https://github.com/applandinc/appmap-agent-js/commit/cf5f4e4a4de22294c27a437056dda588f0365db7))
* remove duplicate stout from main test ([308a9da](https://github.com/applandinc/appmap-agent-js/commit/308a9da0ddec01779a15e682f1101faea97f1d91))
* remove node-version from configuration.childeren ([5d72714](https://github.com/applandinc/appmap-agent-js/commit/5d727143ef7d176b388d7bf252bdf83fef53538a))
* remove wrong assumption that async hooks are never nested ([f66a8b2](https://github.com/applandinc/appmap-agent-js/commit/f66a8b27c4f2833a21c5f47f0adfa5f9141f4072))
* resolved conflicts ([d39070c](https://github.com/applandinc/appmap-agent-js/commit/d39070c09de391f173d6bb53a504cb173dd84ce2))
* set encoding for stderr && allow for normalized hook format ([efda2c8](https://github.com/applandinc/appmap-agent-js/commit/efda2c84d873005c6923cce165fced7eab4a7f10))
* set pid to runtime ([5621718](https://github.com/applandinc/appmap-agent-js/commit/5621718211e707f15eacbd8ab6eaa2baa69b1df2))
* setup entry point ([e24c622](https://github.com/applandinc/appmap-agent-js/commit/e24c622106eb8b775c3390faa5281bc44b4a6f29))
* several integration issues ([0bbff44](https://github.com/applandinc/appmap-agent-js/commit/0bbff44dface4537fcdce712b59eb75b6081683f))
* sort events based on ids before writting ([be257f9](https://github.com/applandinc/appmap-agent-js/commit/be257f904fef3f168b0a1050afa52ec4c4c7e2e1))
* specific event for thread notifying link between threads ([99a685f](https://github.com/applandinc/appmap-agent-js/commit/99a685fbe6b4a445d08d5bf472b6bc0d35aebcc7))
* support for default values in function parameters ([af7c978](https://github.com/applandinc/appmap-agent-js/commit/af7c978732052935fbc8465b9d64092f956395dc))
* test and fix new cleaned util ([5cd83c5](https://github.com/applandinc/appmap-agent-js/commit/5cd83c548b9b05b68c56ce42deabef96da8bf520))
* test storage ([684ab91](https://github.com/applandinc/appmap-agent-js/commit/684ab918b744a6d4a45a7ab73e81c749d2b0e883))
* time is now expressed in second rather than in milliseconds ([e370670](https://github.com/applandinc/appmap-agent-js/commit/e3706707088dfe04bb3dd7a4a16fda3e5d236ff5))
* update interpretation, client and storage with the new dependency injection model ([33904ba](https://github.com/applandinc/appmap-agent-js/commit/33904ba18348e34f2ae1ca3f355bc9db8b732131))
* update json schema ([a015c74](https://github.com/applandinc/appmap-agent-js/commit/a015c742839779ac72adb01077304af6c1cd2887))
* update mysql test to look more like postgres test ([93b909b](https://github.com/applandinc/appmap-agent-js/commit/93b909bd89dd1764c26199931912e79a0b3c18f3))
* update server to new dependencies injection model ([13a7e04](https://github.com/applandinc/appmap-agent-js/commit/13a7e0468d9a88baa7a04f953d36c7f6c3d475f4))
* update trace generation with new configuration output format ([3af8b17](https://github.com/applandinc/appmap-agent-js/commit/3af8b17cf7e9c9d36fd5c638cd76358263f22fe2))
* update validate with new schema ([a1324fb](https://github.com/applandinc/appmap-agent-js/commit/a1324fbe52a277dc115033e00466beb2f4f83275))
* updating instrumentation to comnponents ([8181146](https://github.com/applandinc/appmap-agent-js/commit/818114657bdda9d46328ab0c64efa0a5271c0ed6))
* use a unique thread_id for every event handling ([1c9ab09](https://github.com/applandinc/appmap-agent-js/commit/1c9ab09cc30d81b9621227c60c9d33667712f07b))
* util fixed and tested ([89b38b5](https://github.com/applandinc/appmap-agent-js/commit/89b38b5ebd5aa609528ab9ed015fcae81bf82a31))
* various bugs detected by intergration ([602c797](https://github.com/applandinc/appmap-agent-js/commit/602c797732eb7b6c61a45ced50fd756f06bfec13))
* various fixes ([3ad558d](https://github.com/applandinc/appmap-agent-js/commit/3ad558d0dcbe5850336a38f67773c2058a7cb974))
* various small fixes ([c957d22](https://github.com/applandinc/appmap-agent-js/commit/c957d224c91e242d55741214ee3b12e4a356723d))


### Code Refactoring

* explicit the two separate channels: trace vs track ([91f424d](https://github.com/applandinc/appmap-agent-js/commit/91f424dd204fc3f75695b4c17bca3a65e06d3ef4))


### Features

* (recursively) add output directory if it does not exist ([b36abc2](https://github.com/applandinc/appmap-agent-js/commit/b36abc299402aed0fa61021be4403f93195134c5))
* add bundle/jump model into the schema ([fabb4a5](https://github.com/applandinc/appmap-agent-js/commit/fabb4a5d27dff6a4987978b04ec0c143e4c940d4))
* add configuration option to enable source (disable by default)) ([313a4cd](https://github.com/applandinc/appmap-agent-js/commit/313a4cd5fafb54d8d4ecc17db3565b48bb64d080))
* add local-track-port as a forward to track-port (which does not require a session) ([b235617](https://github.com/applandinc/appmap-agent-js/commit/b2356172b8a235b6e03784a21253a3013669ebe5))
* add log levels ([d9d6d9e](https://github.com/applandinc/appmap-agent-js/commit/d9d6d9e65a1169b21681ff20bff152245afad4d8))
* add log-level as configuration option ([dcdcbfe](https://github.com/applandinc/appmap-agent-js/commit/dcdcbfe41e9efa00f22f8362207a2626232eae35))
* add shallow to file message && deactivate mysql test because of unknown failure ([d703269](https://github.com/applandinc/appmap-agent-js/commit/d7032698450a19c3290a13446da6eebaedda5705))
* add SIGINT handling to gracefully shutdown ([1e68950](https://github.com/applandinc/appmap-agent-js/commit/1e68950a07f2601061af216aa14c7e331958c76b))
* add SIGINT handling to interrupt scenarios execution ([4fd1cfc](https://github.com/applandinc/appmap-agent-js/commit/4fd1cfc8c3338eaae8f8fa3904002f59057aca29))
* add source and comment for functions in classmap ([89c75ee](https://github.com/applandinc/appmap-agent-js/commit/89c75ee7ddcf60b4cc718a963e43432dc8e8c114))
* add two events: bundle and fork for ordering the stack ([75f8866](https://github.com/applandinc/appmap-agent-js/commit/75f88665ed87acd13980aabad87e49db67faf9cd))
* also verify os and node version for setup ([61bf9b3](https://github.com/applandinc/appmap-agent-js/commit/61bf9b3ceb6bc9732ae1c45de50705251c5d7555))
* always provide a defined_class name for events ([299c423](https://github.com/applandinc/appmap-agent-js/commit/299c4230ea62cc52b869b2a923803441a2bc7a52))
* backend glue component and update server ([6da7831](https://github.com/applandinc/appmap-agent-js/commit/6da78315d2173c6927684bfdb1476b31c9760088))
* bake validation in and make available as configuration option ([11a8f62](https://github.com/applandinc/appmap-agent-js/commit/11a8f62396512d6f66d18514124d561175969a6a))
* better default behaviour for configuration ([bef0305](https://github.com/applandinc/appmap-agent-js/commit/bef030574d09ff3995877b052c3293d5705df223))
* better error reporting when failing json schema ([b8aed5b](https://github.com/applandinc/appmap-agent-js/commit/b8aed5b44a9c482cba835ea7072464c2978fc0c8))
* change mode configuration field ([c01e596](https://github.com/applandinc/appmap-agent-js/commit/c01e596cd47f1ab6eaebeb5481005421857fb8f1))
* CLI to help creating configuration files ([badeeb9](https://github.com/applandinc/appmap-agent-js/commit/badeeb9d89f47cdc1bc2e3c57a462a938d52a828))
* config CLI when config file is missing ([9d53ee3](https://github.com/applandinc/appmap-agent-js/commit/9d53ee3956e2e9fb65a8e33c6e460c786990712a))
* configuration can be extended with a null directory, and it will crash if the directory was needed ([4c9ae3e](https://github.com/applandinc/appmap-agent-js/commit/4c9ae3e42b90155259496d84030f5478be3949f8))
* configuration support naming children which are now called scenarios ([7429d33](https://github.com/applandinc/appmap-agent-js/commit/7429d331349d034dfd5c59c294bdf463caf52f94))
* default protocol: inline ([0b5216a](https://github.com/applandinc/appmap-agent-js/commit/0b5216a387c327974a98d2b7cdc0cbe65304bf7a))
* dynamic component build ([c5be9b7](https://github.com/applandinc/appmap-agent-js/commit/c5be9b71dc05da47b9cfb590433b52f025905acc))
* easier to understand configuration ([85a106b](https://github.com/applandinc/appmap-agent-js/commit/85a106b7695497222e7beec867e00d5ef9048b52))
* either util library ([cc6a99a](https://github.com/applandinc/appmap-agent-js/commit/cc6a99a8c836f91f0e76a4ce6f87906a8a43e843))
* engine detection ([fa5f343](https://github.com/applandinc/appmap-agent-js/commit/fa5f3430cc736db20a00eacc85c9ec6281cafb3e))
* expect is now a component and have different behaviours ([fd8f4ab](https://github.com/applandinc/appmap-agent-js/commit/fd8f4ab54cf4c78ec862c504756ee3dfae30e3d2))
* experiment bundle/jump on sqlite3 ([441c180](https://github.com/applandinc/appmap-agent-js/commit/441c180c8ef7531c0f1eeb1db07f9955aebc1729))
* explicit diff between disabled port (null) and random port (0) ([55c3dca](https://github.com/applandinc/appmap-agent-js/commit/55c3dca6acb616ddfa7fe74c1a165ece46afa756))
* express ([6d155d2](https://github.com/applandinc/appmap-agent-js/commit/6d155d2eebc29d688f7d9bf71ae16e2af65f9841))
* extended capabilities of manual recording with remote recording ([f2a20cc](https://github.com/applandinc/appmap-agent-js/commit/f2a20ccb112e56aab4aa037b7f596b966724051a))
* files are now packages instead of classes, also the classMap is now cleanup from agent's specific fields ([8ddfc27](https://github.com/applandinc/appmap-agent-js/commit/8ddfc272ce7319417727831977e2bffae7410d33))
* fill some gaps in entry points but not tested ([12c2b50](https://github.com/applandinc/appmap-agent-js/commit/12c2b50a58d10ca97a37a0ab5c7e3d9633a372ca))
* first attempt at main ([4c04d8c](https://github.com/applandinc/appmap-agent-js/commit/4c04d8c1e7b2d8616cc01b16f2f2bf327e85ac9f))
* frame data structure ([bdc464b](https://github.com/applandinc/appmap-agent-js/commit/bdc464b3a5cd276ad266a6d503aa66703e30f381))
* function names are now duplicated into method_id ([af6de0e](https://github.com/applandinc/appmap-agent-js/commit/af6de0ef739d9baceb2cf5a0f2fda3454c7f8710))
* hook mysql client ([8368a44](https://github.com/applandinc/appmap-agent-js/commit/8368a44ea3dc31128816edd53747a655555a8d65))
* http hook ([f9d371f](https://github.com/applandinc/appmap-agent-js/commit/f9d371f3c1e2d22eab60e72282172ee67bb0771b))
* implement and test postgres hooking ([77fd51c](https://github.com/applandinc/appmap-agent-js/commit/77fd51c6d29df1d4ea23bc5394e6e949b57986f6))
* implement and test runner ([d2f1793](https://github.com/applandinc/appmap-agent-js/commit/d2f17934e0e2e40b91fd71ab66d2fb40d05013f2))
* implement asynchronous jump in trace post-processing ([1089ca6](https://github.com/applandinc/appmap-agent-js/commit/1089ca6ed423fd8d5f3955998fb2ddc3a1dee3af))
* implement manufacturing, event remain to be tested ([2966e95](https://github.com/applandinc/appmap-agent-js/commit/2966e95473ee56f87c0755fa34847b9df75300d8))
* implement sqlite3 hook ([87c8bee](https://github.com/applandinc/appmap-agent-js/commit/87c8beec135b149feb61052674da70e358c767f4))
* log is now a component and have different behaviours ([a054ce2](https://github.com/applandinc/appmap-agent-js/commit/a054ce20e0c12b8432c8960d7868039ae6d05138))
* log level configurable as environment variable ([82b6fbe](https://github.com/applandinc/appmap-agent-js/commit/82b6fbe1ec5198db579a4a6d8e8a9c04ff577063))
* made available remote server ([9cb8c50](https://github.com/applandinc/appmap-agent-js/commit/9cb8c50798727bdc8860f237200bf9b1c440c350))
* manual recorder ([e50e583](https://github.com/applandinc/appmap-agent-js/commit/e50e5832eb743535d844fa6a95716f27061f25dc))
* match document configuration options ([65226b3](https://github.com/applandinc/appmap-agent-js/commit/65226b3b42b31164797233f682fd02a016fb0247))
* metadata ([168a2c5](https://github.com/applandinc/appmap-agent-js/commit/168a2c5750e827137a259431605054d7098f2bf7))
* mocha recorder ([9621c54](https://github.com/applandinc/appmap-agent-js/commit/9621c54a09f330ed30c65882fd2de19d48677f10))
* more automated build process which provides default components ([57fe80e](https://github.com/applandinc/appmap-agent-js/commit/57fe80edefd6c01cb9f3458bc54985fd49b615a5))
* more explicit output options (and remove indent) ([045c414](https://github.com/applandinc/appmap-agent-js/commit/045c414d4bf133b76a6de7cc3471c3214df7bc2c))
* mysql query hook ([fa08ff4](https://github.com/applandinc/appmap-agent-js/commit/fa08ff4dad4798e711786d55635ff5100b0f70eb))
* new callstack ordering ([dfb3abb](https://github.com/applandinc/appmap-agent-js/commit/dfb3abbdf262dc711496ff05b31e5231b379a5f4))
* new empty recorder for supporting http remote recording requests ([b13fc7f](https://github.com/applandinc/appmap-agent-js/commit/b13fc7f1bcf025e23fc4e70ad73c1b59fd4b5826))
* new event data compilation ([c6db2e4](https://github.com/applandinc/appmap-agent-js/commit/c6db2e471197de4d6643b00b9da8f5283bc878a5))
* pg hook ([43c465c](https://github.com/applandinc/appmap-agent-js/commit/43c465c6d5bf56f16d0dc22c7490c17857b8b04c))
* port configuration from main branch ([f716621](https://github.com/applandinc/appmap-agent-js/commit/f7166210710e387c33ae68fdb6004bb03dbab29f))
* port hook for grouping asynchronous events ([3be8d94](https://github.com/applandinc/appmap-agent-js/commit/3be8d945904899905b5f7e80fd59d61ca868a510))
* port hook module from main branch ([10f29d1](https://github.com/applandinc/appmap-agent-js/commit/10f29d1f79f7fb139b38f79377197fa7f3eca81e))
* port validation from main branch ([7a44554](https://github.com/applandinc/appmap-agent-js/commit/7a44554dcd2d6e290f5f4409a37440b3fee6add6))
* post processing of event trace to recover stack structure ([9850cc9](https://github.com/applandinc/appmap-agent-js/commit/9850cc921475c6c551e842888943784ecd2d67b6))
* progress on node entry point ([82532e1](https://github.com/applandinc/appmap-agent-js/commit/82532e135898d8295fb014d2eb422ded7edb3817))
* progress on post processing the trace ([d7143c9](https://github.com/applandinc/appmap-agent-js/commit/d7143c9226fc0a9b4bbb5ce6586a548f82971157))
* propagate bundle/jump model to hooks ([30ff104](https://github.com/applandinc/appmap-agent-js/commit/30ff104d105f3322616c3201ae0e7563f745c8db))
* provide a type tag to anonymous names ([452154f](https://github.com/applandinc/appmap-agent-js/commit/452154f514d7790fdf80077f78a93d97aaf7daae))
* provide more information when a json schema failed ([cf99888](https://github.com/applandinc/appmap-agent-js/commit/cf99888e88dd6442b381c3ae1af7b2a8ce576bb5))
* provide unique names (counter-based) to anonymous code objects ([b6657f4](https://github.com/applandinc/appmap-agent-js/commit/b6657f4c9b5a89a3bb11a81bf123ca5d3f2d6f2a))
* relative paths in classMap and events instead of absolute paths ([089ea6e](https://github.com/applandinc/appmap-agent-js/commit/089ea6e1fb6d59b3f7c238410efe669b717e5ffd))
* reverse defined_class and method_id field &&  disable toString on functions ([58ed1a1](https://github.com/applandinc/appmap-agent-js/commit/58ed1a1ee9ea664862b9f74423e5ad77cbedfd1d))
* revert to duplicating names for function code objects ([efd3936](https://github.com/applandinc/appmap-agent-js/commit/efd39369d06900063069da4fc70793353ab4668b))
* serilization now better matches requirements in the appmap spec ([6f842bd](https://github.com/applandinc/appmap-agent-js/commit/6f842bdda31dfabe39aede37ebc3492bd8944367))
* setup clo ([8cdf658](https://github.com/applandinc/appmap-agent-js/commit/8cdf658e44d1d3e5f9c7eda5e9ac7d6d01977f63))
* shallow mode ([a6d03b9](https://github.com/applandinc/appmap-agent-js/commit/a6d03b9ba516d606c01bc2b4102ed5fe0682a4ff))
* simpler more inline with the spec naming ([4c9f58b](https://github.com/applandinc/appmap-agent-js/commit/4c9f58b098818f52a9838643d20e7d4b0ded77a1))
* sketch of manufacture ([f78b719](https://github.com/applandinc/appmap-agent-js/commit/f78b71989dfe1ab9454212a5f86871c52141159b))
* small adjustements to facilate implementing entry points ([11f4a06](https://github.com/applandinc/appmap-agent-js/commit/11f4a067fda80252b3cf71d0e5750b251e50d5eb))
* split trace between tracks ([5e119ec](https://github.com/applandinc/appmap-agent-js/commit/5e119ecd0cc47cda863b75aebfe0c9c28ba70265))
* sqlite3 hook ([92306ea](https://github.com/applandinc/appmap-agent-js/commit/92306ead95202c8fa1a03688fb4761e7730cc630))
* start porting configuration ([d4cfbdc](https://github.com/applandinc/appmap-agent-js/commit/d4cfbdc0bccbaaa2fbf26f6cf81189e5cd731ec2))
* starting a track now requires a path to solve relative paths ([90a5fd2](https://github.com/applandinc/appmap-agent-js/commit/90a5fd20e46bd5809adf94b24e62014190437a1a))
* static build can be scoped to reduce footprint ([e0e83b3](https://github.com/applandinc/appmap-agent-js/commit/e0e83b37ccecbdccf68019bd48cf287120ed6779))
* stored vs served appmap are not longer tied to traceClient vs trackClient ([4b549fb](https://github.com/applandinc/appmap-agent-js/commit/4b549fb650a47c5ef203a513be61680fdbcad78a))
* strip extension when naming appmap file based on main path ([149fda6](https://github.com/applandinc/appmap-agent-js/commit/149fda67a1915c30635ed168a4793393147dcd56))
* support esm on mocha thanks to the abomination ([d92865c](https://github.com/applandinc/appmap-agent-js/commit/d92865cc3d9eaa2c63294c6e2abca816b0dcb828))
* support express normalized path and parameters ([8f2bdad](https://github.com/applandinc/appmap-agent-js/commit/8f2bdadd7ec1d2f9ed086384341b1d94687c5376))
* support for arbitrary slice of trace ([5978fd7](https://github.com/applandinc/appmap-agent-js/commit/5978fd7b126ef62aaa490c420b0ab11bcbc4855b))
* support for regexp in exclude elements ([0217d0f](https://github.com/applandinc/appmap-agent-js/commit/0217d0f3f4c6ef4bd1bc44eb4215157030782e6c))
* support for regular expressions in exclude ([a4a7ab0](https://github.com/applandinc/appmap-agent-js/commit/a4a7ab004ac81ea4117cd9691894467e3a6e65c6))
* support for remote recording on batch ([344485d](https://github.com/applandinc/appmap-agent-js/commit/344485d6139724e074ae4ff307a97804f0c16aeb))
* support intercept port for remote recording ([2279a62](https://github.com/applandinc/appmap-agent-js/commit/2279a628d78b2be571ee7e76dc06b820744f623e))
* switch to fuction name only in method_id ([309ce0a](https://github.com/applandinc/appmap-agent-js/commit/309ce0a1bf70e5e9d2158e5364f3087a7259c40e))
* title ([14eb852](https://github.com/applandinc/appmap-agent-js/commit/14eb852042709f391659995bc118fb639d8df4dc))
* trace post processing of new bundle/jump model ([5f925ce](https://github.com/applandinc/appmap-agent-js/commit/5f925ce9207bc45961cdaa6f66fb7ddf96a96de3))
* use @ character to denote the name of an unbound node ([b3f3b3b](https://github.com/applandinc/appmap-agent-js/commit/b3f3b3b1d44d0994aa1cc13713ff5c2ae23e3da7))
* warn instead of fail when missing conf file ([486a7cb](https://github.com/applandinc/appmap-agent-js/commit/486a7cb5f896de82f75b894ac52455932029466a))


### Performance Improvements

* lower time accuracy to microsecond ([3463ce8](https://github.com/applandinc/appmap-agent-js/commit/3463ce8adedbb2c2115e5d2a4f4ae36ee007d4e0))
* more compact message format (backend) ([4805cb8](https://github.com/applandinc/appmap-agent-js/commit/4805cb8fecaa8ad1c1f5ff5270743a1a7de88be7))


### BREAKING CHANGES

* remove enabled and mode configuration field
* Configuration changes: 'ordering' instead of 
'hooks.group' and 'processes' separated from 'enabled'.
* rename configuration keys: `port -> trace-port`, `protocol -> trace-protocol`, and `remote-recording-port -> track-port`.
* The trace should be looking like a single big trace now.

# [3.2.0](https://github.com/applandinc/appmap-agent-js/compare/v3.1.2...v3.2.0) (2021-05-28)


### Features

* support for node12 (latest still maintained node version)) ([74d1056](https://github.com/applandinc/appmap-agent-js/commit/74d105687fb4ddce1c99b780f2507df17f997004))

## [3.1.2](https://github.com/applandinc/appmap-agent-js/compare/v3.1.1...v3.1.2) (2021-05-21)


### Bug Fixes

* add ajv schema *yml* ([63de260](https://github.com/applandinc/appmap-agent-js/commit/63de2606eaf92b42d44744cf35a269ad9d4437bc))

## [3.1.1](https://github.com/applandinc/appmap-agent-js/compare/v3.1.0...v3.1.1) (2021-05-21)


### Bug Fixes

* bump to push new npm version ([f4bc231](https://github.com/applandinc/appmap-agent-js/commit/f4bc231f98a14022127deb5a759c713fdc2a457c))

# [3.1.0](https://github.com/applandinc/appmap-agent-js/compare/v3.0.0...v3.1.0) (2021-05-21)


### Bug Fixes

* catch network error (due to ECONRESET) and less globs and more regexp) ([7a14afb](https://github.com/applandinc/appmap-agent-js/commit/7a14afbe5d539226934fc7ea292a30be3bc96092))
* correct a few bugs where the client and the server protocol did not match ([2c44044](https://github.com/applandinc/appmap-agent-js/commit/2c44044d6acb4afdeedc7fbe47b79fd9e6884679))
* fix infinite http recursion and change conf format to conform to initial values ([4ca1ff9](https://github.com/applandinc/appmap-agent-js/commit/4ca1ff9a0e398a8063dd24cbe902f3300b4b5e35))
* test child spawning and correct a few bugs linked to client expect checks ([471b955](https://github.com/applandinc/appmap-agent-js/commit/471b95511b21b9a58f6e6d30437cd7d377a272b7))
* various bug fixes and better seperation of errors between the base and the meta layer ([cc80044](https://github.com/applandinc/appmap-agent-js/commit/cc80044c5b1338b19a6301bb3685299f802388c8))


### Features

* add hook for http request ([3421530](https://github.com/applandinc/appmap-agent-js/commit/34215308f2e8ac5aa2c98da7ff26e917f1bff00c))
* add https hooking ([598d87e](https://github.com/applandinc/appmap-agent-js/commit/598d87e452051a37f11de0501801628753445ec8))
* add inline extends field for configuration and embeded cwd ([e4addf3](https://github.com/applandinc/appmap-agent-js/commit/e4addf3ea837cb6a37fb54feae92e8f179c221c9))
* cosmetic improvements ([eafc86a](https://github.com/applandinc/appmap-agent-js/commit/eafc86a96d123c492ec6f9ceaaeb86b18cf6edec))
* provide more options to the user to spawn child processes ([61522a3](https://github.com/applandinc/appmap-agent-js/commit/61522a3a1809b7abdecddaf4196f854036cd9cc7))

# [3.0.0](https://github.com/applandinc/appmap-agent-js/compare/v2.12.1...v3.0.0) (2021-05-13)


### Bug Fixes

* eslint ([4383c7e](https://github.com/applandinc/appmap-agent-js/commit/4383c7e61eef6983440e0f9b98bf87975aa59493))
* eslint the entire project ([e230a6b](https://github.com/applandinc/appmap-agent-js/commit/e230a6b0ce41e477df4c55e6cf392e41ced94030))
* merge from ci ([615afde](https://github.com/applandinc/appmap-agent-js/commit/615afde4613e1987d1e68f7aff2341440a8b11c9))
* more robust error reporting for configuration throuhg haskell--inspired either ([31b9a68](https://github.com/applandinc/appmap-agent-js/commit/31b9a685342ea8b99000697a85acc50045ddef6a))
* updated instrumentation to new error handling and runtime variables ([f28eefc](https://github.com/applandinc/appmap-agent-js/commit/f28eefccbbe74d8eeeb8046d87fcbb5c58847a7f))


### Features

* add termination for entire dispatcher to ensure appmaps are saved on disk ([c2fb027](https://github.com/applandinc/appmap-agent-js/commit/c2fb027ae727670034feee629fe2d5442df0a87d))
* done refactoring the server still need testing ([f333032](https://github.com/applandinc/appmap-agent-js/commit/f3330328ae19253bc87f7cbe9da9a7410e424311))
* extensive refactoring of the client to support flexible recording ([18974f7](https://github.com/applandinc/appmap-agent-js/commit/18974f78df2506b7cd872a66c559865134002ffe))
* user can now spawn multiple child processes ([c338c29](https://github.com/applandinc/appmap-agent-js/commit/c338c29493d9d83e3d61698ac144be1f9ec14654))


### BREAKING CHANGES

* The way to launch a process-wide client has been modified. The client can now be
recorded through a library as well.

## [2.12.1](https://github.com/applandinc/appmap-agent-js/compare/v2.12.0...v2.12.1) (2021-04-30)


### Performance Improvements

* disabled processes will no longer hook require/import ([1037385](https://github.com/applandinc/appmap-agent-js/commit/103738592c7d69e6ccfc79911952a55d4e6f6399))

# [2.12.0](https://github.com/applandinc/appmap-agent-js/compare/v2.11.0...v2.12.0) (2021-04-29)


### Features

* provide more options to output appmaps ([9046f0e](https://github.com/applandinc/appmap-agent-js/commit/9046f0ee7623351ead2d95140300606712faf5b3))

# [2.11.0](https://github.com/applandinc/appmap-agent-js/compare/v2.10.0...v2.11.0) (2021-04-29)


### Features

* support for glob pattern for the 'enabled' configuration option ([707cc97](https://github.com/applandinc/appmap-agent-js/commit/707cc9703b55042712a5e8e0139c88e3f11bf9bb))

# [2.10.0](https://github.com/applandinc/appmap-agent-js/compare/v2.9.0...v2.10.0) (2021-04-29)


### Bug Fixes

* update build with latest changes ([57b766a](https://github.com/applandinc/appmap-agent-js/commit/57b766a53ff838c7bf5ee1d56ee2f17c7656a92b))


### Features

* it is now possible to disabled recording on process-scale ([8b45199](https://github.com/applandinc/appmap-agent-js/commit/8b45199b37cf34e6625c2a8623501dcd105b21e1))

# [2.9.0](https://github.com/applandinc/appmap-agent-js/compare/v2.8.1...v2.9.0) (2021-04-28)


### Features

* cache to prevent appmaps from overwritting themselves and add default map name ([8724059](https://github.com/applandinc/appmap-agent-js/commit/8724059609d1c63be684f747ff1193e9ed5937a1))

## [2.8.1](https://github.com/applandinc/appmap-agent-js/compare/v2.8.0...v2.8.1) (2021-04-28)


### Bug Fixes

* remove legacy code dependent on node's argument rather than NODE_OPTIONS ([0ce1b42](https://github.com/applandinc/appmap-agent-js/commit/0ce1b427a1c1b5e936d40fd5e1f367aa7a00dbbc))

# [2.8.0](https://github.com/applandinc/appmap-agent-js/compare/v2.7.1...v2.8.0) (2021-04-28)


### Features

* use NODE_OPTIONS instead of node's argv which provides automatic support for child_process ([b9c1dd3](https://github.com/applandinc/appmap-agent-js/commit/b9c1dd3c7a8ca6ecc8dd63ee31f8f58f2db4c12c))

## [2.7.1](https://github.com/applandinc/appmap-agent-js/compare/v2.7.0...v2.7.1) (2021-04-28)


### Bug Fixes

* fix argv processing in bin/index ([bab6a53](https://github.com/applandinc/appmap-agent-js/commit/bab6a5315f625c5b320739c69e1c4e4f4f0e6062))

# [2.7.0](https://github.com/applandinc/appmap-agent-js/compare/v2.6.0...v2.7.0) (2021-04-28)


### Bug Fixes

* merge from ci ([f0940f6](https://github.com/applandinc/appmap-agent-js/commit/f0940f647de9a980993c68b16c66d997352c6819))


### Features

* better handling of node version to diagnose requirements issue ([cd900ac](https://github.com/applandinc/appmap-agent-js/commit/cd900acb330fdb0ecd68bd2403bf35ef5377c779))

# [2.6.0](https://github.com/applandinc/appmap-agent-js/compare/v2.5.0...v2.6.0) (2021-04-27)


### Features

* improved command line interface ([5ed31b4](https://github.com/applandinc/appmap-agent-js/commit/5ed31b45c43f656f043d6389b33d48928eaea228))

# [2.5.0](https://github.com/applandinc/appmap-agent-js/compare/v2.4.0...v2.5.0) (2021-04-22)


### Bug Fixes

* pull from alpha ([a8b4d11](https://github.com/applandinc/appmap-agent-js/commit/a8b4d116a80aa92df6d10eb981f8cb624db17938))


### Features

* all metadata are now included in config and initialization query provides more info ([cc4640f](https://github.com/applandinc/appmap-agent-js/commit/cc4640fe855f7e44dda38d7b595f5b9eceec17b8))

# [2.4.0](https://github.com/applandinc/appmap-agent-js/compare/v2.3.0...v2.4.0) (2021-04-21)


### Features

* propagate hook-child-process cli argument to forked processes ([ea6af3b](https://github.com/applandinc/appmap-agent-js/commit/ea6af3bb80ebd1e1322f224090154773e4f667e2))

# [2.3.0](https://github.com/applandinc/appmap-agent-js/compare/v2.2.0...v2.3.0) (2021-04-21)


### Features

* child_process methods can now be hooked so that their spawn processes are also instrumented ([f34132b](https://github.com/applandinc/appmap-agent-js/commit/f34132b3511f2352e84e4ed03c82f4a7a689aa55))

# [2.2.0](https://github.com/applandinc/appmap-agent-js/compare/v2.1.2...v2.2.0) (2021-04-20)


### Bug Fixes

* update remaining of the application to new configuration feature ([6fed62b](https://github.com/applandinc/appmap-agent-js/commit/6fed62bae809114e828dd49a978f71f655bb3360))


### Features

* add support for package listing and exclusions and use json schema validator ([ffa3c3f](https://github.com/applandinc/appmap-agent-js/commit/ffa3c3f06d92dc1ce461312f4151b058cbb198e3))

## [2.1.2](https://github.com/applandinc/appmap-agent-js/compare/v2.1.1...v2.1.2) (2021-04-19)


### Bug Fixes

* update posix-socket-messaging ([625fd8c](https://github.com/applandinc/appmap-agent-js/commit/625fd8c9649a71e005fbb9f3f53a04231e28b616))

## [2.1.1](https://github.com/applandinc/appmap-agent-js/compare/v2.1.0...v2.1.1) (2021-04-15)


### Bug Fixes

* path to bin ([e537164](https://github.com/applandinc/appmap-agent-js/commit/e537164321d48ef27174eeb002f42f8ea435d3d7))

# [2.1.0](https://github.com/applandinc/appmap-agent-js/compare/v2.0.1...v2.1.0) (2021-04-15)


### Bug Fixes

* eslint ([b44cf23](https://github.com/applandinc/appmap-agent-js/commit/b44cf23d1b1bc94d8efdd2e768d3396e94c49e74))
* rely on more comptible curl options ([b501a8d](https://github.com/applandinc/appmap-agent-js/commit/b501a8da315130f767fea11d7158beb4910b62de))
* run eslint and prettier ([93b34f8](https://github.com/applandinc/appmap-agent-js/commit/93b34f81a4d8fae285db36c919a0aea5fc516875))
* run eslint and prettier ([266fe27](https://github.com/applandinc/appmap-agent-js/commit/266fe271bf56d99a8a8bca3a93a82f792472b84d))


### Features

* added new communication channel between server and client ([35a7ff0](https://github.com/applandinc/appmap-agent-js/commit/35a7ff046a1da43f604ea59548c7b049cdf19cd3))
* replace fork channel by messaging channel ([31e85c2](https://github.com/applandinc/appmap-agent-js/commit/31e85c29c18323f98535518bac0218ab077f06dc))


### Performance Improvements

* http optimized empty body when null return ([d3be7ec](https://github.com/applandinc/appmap-agent-js/commit/d3be7ecbe62293a9817f5d4f4868fea05df6336e))

## [2.0.1](https://github.com/applandinc/appmap-agent-js/compare/v2.0.0...v2.0.1) (2021-04-04)


### Bug Fixes

* correct outdated global variable (PROCESS_ID and SEND) ([a784eaa](https://github.com/applandinc/appmap-agent-js/commit/a784eaa4f158c3a76e18728a0a5d279a17c4316d))

# [2.0.0](https://github.com/applandinc/appmap-agent-js/compare/v1.0.2...v2.0.0) (2021-04-04)


### Bug Fixes

* added current env variables to spawn inline client which is necessary for PATH) ([dc4224e](https://github.com/applandinc/appmap-agent-js/commit/dc4224ec14de9b53eed4228432fecf855cddb9ec))
* correct some erroneous appmap methods ([4361823](https://github.com/applandinc/appmap-agent-js/commit/43618230c997562d49b4710b08c8f32a07f4514b))
* fix inversion argument between client and server for instrument query and lint-related fixes ([2148505](https://github.com/applandinc/appmap-agent-js/commit/21485053534e116d37597662a6a54f7ea6f2d67c))
* forgot some files in the big refactoring commit ([aef71ed](https://github.com/applandinc/appmap-agent-js/commit/aef71ed1fe61b8396d8dcf5266c669d3ab1c6d42))
* lint all ([23471dd](https://github.com/applandinc/appmap-agent-js/commit/23471dd4810fff1ea33f4e8ca3b3e01c8ab10fa2))
* lint lib ([3b6a05b](https://github.com/applandinc/appmap-agent-js/commit/3b6a05b4004f5913963a3b208f3d8642a62d6ca5))
* more linent test on current repostory url (failed with travis)) ([24dd21b](https://github.com/applandinc/appmap-agent-js/commit/24dd21b6341d28b9d8abb3e55db752f6d206728c))
* start testing the client ([c581b88](https://github.com/applandinc/appmap-agent-js/commit/c581b880710120588bf315e9a44d36072cf0b607))


### Features

* config system is now more flexible ([465a918](https://github.com/applandinc/appmap-agent-js/commit/465a918b7d688d4a12c225a1235ac6f716e9b463))
* easier bin call ([86f1b6d](https://github.com/applandinc/appmap-agent-js/commit/86f1b6ddb772803fb0291fe0dacc6d4221845d78))
* implement hooks for commonjs and native modules and refactor the architecture ([14d1cee](https://github.com/applandinc/appmap-agent-js/commit/14d1cee56c2aa6e81f3b270a12673c026778b22e))


### BREAKING CHANGES

* Some old environment variables no longer work
* The way the agent is invoked is completely changed

## [1.0.2](https://github.com/applandinc/appmap-agent-js/compare/v1.0.1...v1.0.2) (2021-03-30)


### Bug Fixes

* add hashbang to bin ([0219d9e](https://github.com/applandinc/appmap-agent-js/commit/0219d9e7de3825c92af3f4a1f9c86d7d3e0bddf1))

## [1.0.1](https://github.com/applandinc/appmap-agent-js/compare/v1.0.0...v1.0.1) (2021-03-30)


### Bug Fixes

* added bin to package json ([6ac7995](https://github.com/applandinc/appmap-agent-js/commit/6ac7995797bd394c04b19764b39b0bfdacd23ae6))

# 1.0.0 (2021-03-30)


### Features

* match appmap name with target file name ([4619f3d](https://github.com/applandinc/appmap-agent-js/commit/4619f3da443085c8b42f2145d4d865805ba0b8ab))
