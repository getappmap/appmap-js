# [@appland/search-v1.2.3](https://github.com/getappmap/appmap-js/compare/@appland/search-v1.2.2...@appland/search-v1.2.3) (2025-07-07)


### Bug Fixes

* Improve worst case performance of file indexing ([3a8baa1](https://github.com/getappmap/appmap-js/commit/3a8baa18f7fdb7b4ecf8df91ce2f4ff27ea13d18))
* Optimize file indexing by caching binary content by file extension ([e402f68](https://github.com/getappmap/appmap-js/commit/e402f6872ce041bab0e5b4124ff9fa059bc5b321))
* Prevent file index from being re-created ([d59717f](https://github.com/getappmap/appmap-js/commit/d59717fd7b09d60608625d0b3ecd14cbe82b975f))

# [@appland/search-v1.2.2](https://github.com/getappmap/appmap-js/compare/@appland/search-v1.2.1...@appland/search-v1.2.2) (2025-05-01)


### Bug Fixes

* Migrate from node-sqlite3-wasm to better-sqlite3 ([47b7698](https://github.com/getappmap/appmap-js/commit/47b769860ce7a55dc3806981da2a78a408bc0648))

# [@appland/search-v1.2.1](https://github.com/getappmap/appmap-js/compare/@appland/search-v1.2.0...@appland/search-v1.2.1) (2025-03-11)


### Bug Fixes

* Add PerformanceObserver import ([#2258](https://github.com/getappmap/appmap-js/issues/2258)) ([595b542](https://github.com/getappmap/appmap-js/commit/595b542c33529b7fb5e8ed07126f44bc5a545137))

# [@appland/search-v1.2.0](https://github.com/getappmap/appmap-js/compare/@appland/search-v1.1.3...@appland/search-v1.2.0) (2025-02-27)


### Bug Fixes

* Finalize insert and search operations in FileIndex close method ([19fe2e8](https://github.com/getappmap/appmap-js/commit/19fe2e8574cf11e6619629331d7deb7fbdcb11c5))
* Fix file index scoring priorities ([9c798bc](https://github.com/getappmap/appmap-js/commit/9c798bca5c943e9e344b838314f9e0739082c4d9))
* Migrate from better-sqlite3 to node-sqlite3-wasm for improved compatibility ([86e0fe5](https://github.com/getappmap/appmap-js/commit/86e0fe5386286816473c0b16a91f7fa80f8706af))


### Features

* Add performance measurement to search CLI ([1fc4ef3](https://github.com/getappmap/appmap-js/commit/1fc4ef331256a861c6de3e310cbdd70b7a9aa41c))
* Cache the file index ([fa465d2](https://github.com/getappmap/appmap-js/commit/fa465d244688da939c86444ba4652feff207f378))

# [@appland/search-v1.1.3](https://github.com/getappmap/appmap-js/compare/@appland/search-v1.1.2...@appland/search-v1.1.3) (2025-02-05)


### Bug Fixes

* Snippet paths are URI encoded ([088ac7e](https://github.com/getappmap/appmap-js/commit/088ac7eb22dceadd320ae1a162ee8d7290f88b9b))

# [@appland/search-v1.1.2](https://github.com/getappmap/appmap-js/compare/@appland/search-v1.1.1...@appland/search-v1.1.2) (2025-01-23)


### Bug Fixes

* Performance issue when chunking large documents ([cfff5a0](https://github.com/getappmap/appmap-js/commit/cfff5a0f9937f8fb57d3344812bc304e6292819e))
* Prevent re-tokenization of chunks ([2b75aaf](https://github.com/getappmap/appmap-js/commit/2b75aafe35f40abae21961acf4363edbae810aee))
* Tokenization no longer hangs the process ([a7df088](https://github.com/getappmap/appmap-js/commit/a7df088461add710b0f5e91aaec0ce92b2e1baed))
* Tokenization will consider the file type ([727c29b](https://github.com/getappmap/appmap-js/commit/727c29be5f31c09e736b9ab0554a8094b46a01a4))

# [@appland/search-v1.1.1](https://github.com/getappmap/appmap-js/compare/@appland/search-v1.1.0...@appland/search-v1.1.1) (2024-12-18)


### Bug Fixes

* Extract complete chunk when splitting text ([75d2f5d](https://github.com/getappmap/appmap-js/commit/75d2f5df06c9794b772116c2facde366d5e1cd7d))

# [@appland/search-v1.1.0](https://github.com/getappmap/appmap-js/compare/@appland/search-v1.0.1...@appland/search-v1.1.0) (2024-12-01)


### Bug Fixes

* Pass absolute path when loading file content ([85060bb](https://github.com/getappmap/appmap-js/commit/85060bb432fec9a1ee2d461fa671cb18b0f21fe6))
* Search for 'code' ([d209727](https://github.com/getappmap/appmap-js/commit/d209727d4ec19d8027b1cb4eb36ed31a60d9eb21))


### Features

* Add session deletion ([9ccd947](https://github.com/getappmap/appmap-js/commit/9ccd947f110857d5d881a31bf0c947bb02f1f2c5))
* Associate boost factor data with a session id ([7031193](https://github.com/getappmap/appmap-js/commit/70311932553adb0aca4ae7f6f11af23790921bdf))
* Define and export SnippetId type ([8e3be79](https://github.com/getappmap/appmap-js/commit/8e3be7949c62a11ed1d57b1c88df2868aa3f10cd))
* Search for AppMap data using @appland/search ([ac00047](https://github.com/getappmap/appmap-js/commit/ac0004717147a095f1fa609c2aa341dec6e6c7bc))

# [@appland/search-v1.0.1](https://github.com/getappmap/appmap-js/compare/@appland/search-v1.0.0...@appland/search-v1.0.1) (2024-12-01)


### Bug Fixes

* Detect and skip binary files when indexing ([b42fedf](https://github.com/getappmap/appmap-js/commit/b42fedf258e42539243f3aea2727115846b8f19b))

# @appland/search-v1.0.0 (2024-11-06)


### Features

* @appland/search package ([dbf7d9a](https://github.com/getappmap/appmap-js/commit/dbf7d9a32593e19df9a8732f18e32227dcb53aca))
