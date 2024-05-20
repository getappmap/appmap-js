# [@appland/navie-v1.11.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.10.0...@appland/navie-v1.11.0) (2024-05-20)


### Bug Fixes

* Add [@vector-terms](https://github.com/vector-terms) command ([6267119](https://github.com/getappmap/appmap-js/commit/6267119bdaac5682956b78dbce1890adefa409f9))
* Fix typos ([03990fd](https://github.com/getappmap/appmap-js/commit/03990fd11d5041784e739900f3bc8447711939af))
* Remove JSON parse warning ([c1477a0](https://github.com/getappmap/appmap-js/commit/c1477a0a5672a32d99b5104bacdaa51a0949f18a))
* Update the question after command selection ([e81cd1b](https://github.com/getappmap/appmap-js/commit/e81cd1b90bae48c953e141da7792a0a9ebb85180))


### Features

* Introduce Navie commands, including [@classify](https://github.com/classify) ([e76a3fc](https://github.com/getappmap/appmap-js/commit/e76a3fcaa825a1fe0bd8e0db5042e2ee38989a84))
* Update prompts and context ([b195de2](https://github.com/getappmap/appmap-js/commit/b195de2b85c564d1bf7f2eee10e4d10087601b57))

# [@appland/navie-v1.10.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.9.2...@appland/navie-v1.10.0) (2024-05-17)


### Bug Fixes

* Don't instruct code editor users to install the plugin ([5b0eaa6](https://github.com/getappmap/appmap-js/commit/5b0eaa6f7075b9ddf94bb725b51d50d49c9fa930))
* Improve handling of code fences ([e3e4b41](https://github.com/getappmap/appmap-js/commit/e3e4b41b0ccebd98e8bb0a49ca9e2b0e6043d088))


### Features

* Change default temperature and make it customizable ([5a2bc41](https://github.com/getappmap/appmap-js/commit/5a2bc416ef96dccdd290bec0acd5914eeb439c85))
* Emit agent and classification events ([a73bcaa](https://github.com/getappmap/appmap-js/commit/a73bcaa276835b8def2d56c270aab358ca35443f))

# [@appland/navie-v1.9.2](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.9.1...@appland/navie-v1.9.2) (2024-05-14)


### Bug Fixes

* De-emphasize manual creation of appmap.yml ([79e44cb](https://github.com/getappmap/appmap-js/commit/79e44cb5926975fdf0a670d6cf5c393f6c366fd5))

# [@appland/navie-v1.9.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.9.0...@appland/navie-v1.9.1) (2024-05-10)


### Bug Fixes

* Don't prompt with appmapStats for non-arch questions ([8b74c8e](https://github.com/getappmap/appmap-js/commit/8b74c8ef16632567ff8bcca37b9c43afd10578d2))

# [@appland/navie-v1.9.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.8.0...@appland/navie-v1.9.0) (2024-04-30)


### Features

* Switch to gpt-4-turbo-2024-04-09 as default ([b3b9604](https://github.com/getappmap/appmap-js/commit/b3b960470f0665e9dfba40266236b20c2935db7b))

# [@appland/navie-v1.8.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.7.0...@appland/navie-v1.8.0) (2024-04-30)


### Features

* Update Navie token limit to 12,000 ([7d6e0db](https://github.com/getappmap/appmap-js/commit/7d6e0db32927cd2963317db5ce9a00f4182b7d30))

# [@appland/navie-v1.7.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.6.0...@appland/navie-v1.7.0) (2024-04-29)


### Features

* Clarify context item fields ([78351af](https://github.com/getappmap/appmap-js/commit/78351af83dbd8897479e28ffc7cb49ad410664d7))
* Include code editor in ProjectInfo struct. ([4701810](https://github.com/getappmap/appmap-js/commit/4701810948f12b9981a2fc7dce718cc1bf5fd6b0))

# [@appland/navie-v1.6.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.5.1...@appland/navie-v1.6.0) (2024-04-22)


### Features

* Apply fixes and updates to the apply-context function. ([7c150c0](https://github.com/getappmap/appmap-js/commit/7c150c002f99bff26384329d3c32315c11583e3e))
* Consider labels when providing the context ([9268446](https://github.com/getappmap/appmap-js/commit/92684465bef2c2de2714d771294a1c8496a4254e))
* Define ContextV2 types for Navie ([c03de02](https://github.com/getappmap/appmap-js/commit/c03de0260a65bece067ac90a1cba7345a86a406c))
* Merge full-text search results with AppMap results ([2b53751](https://github.com/getappmap/appmap-js/commit/2b5375139a76dcf5f256a5360bb2d808d99b326a))
* Provide directives for making AppMap data ([363edbb](https://github.com/getappmap/appmap-js/commit/363edbbd9601dc70b152241676bf362962669733))
* Remove 'patch' directives from the [@generate](https://github.com/generate) prompt ([6311e2f](https://github.com/getappmap/appmap-js/commit/6311e2ff2898ac8cede8ae63107481d1eeb0040d))
* Tone down the "Make AppMaps" pressure ([8e1026d](https://github.com/getappmap/appmap-js/commit/8e1026d34b71e4625fcb0d132f80048dfd74b4a5))
* Use explain mode even when there are no AppMaps ([d157975](https://github.com/getappmap/appmap-js/commit/d15797500b7170c30c8f5319719041b72abbe8a2))
* vector-terms service distinguishes between "context" and "instructions" ([80b0b7e](https://github.com/getappmap/appmap-js/commit/80b0b7e2ddbb2012456de12e1af8676223b9c764))

# [@appland/navie-v1.5.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.5.0...@appland/navie-v1.5.1) (2024-03-27)


### Bug Fixes

* Request context serially ([3ce6188](https://github.com/getappmap/appmap-js/commit/3ce61888bc1b4f124db271e9ffcc1efa77811b87))

# [@appland/navie-v1.5.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.4.0...@appland/navie-v1.5.0) (2024-03-26)


### Features

* Classify each question with likelihoods ([b8e86ae](https://github.com/getappmap/appmap-js/commit/b8e86ae49607e312298dcfb604feea32c718e8ef))
* Implement [@help](https://github.com/help) mode ([58f36f3](https://github.com/getappmap/appmap-js/commit/58f36f392b875bbd6a8301f68ecb18c505d2bb97))
* Incorporate help into the explain agent ([b8e846d](https://github.com/getappmap/appmap-js/commit/b8e846ddf09e8e07f9eb52c689b35318ae0dde05))
* Refactor navie into agent modes ([2b1a7f6](https://github.com/getappmap/appmap-js/commit/2b1a7f65e828332eb1e38cac12f85c8aff833880))

# [@appland/navie-v1.4.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.3.0...@appland/navie-v1.4.0) (2024-03-26)


### Bug Fixes

* Merge system messages into one to support more LLMs ([9b34fc7](https://github.com/getappmap/appmap-js/commit/9b34fc73e3fdaf811737c1d809d60f1f55b310f7))


### Features

* Allow configuring model with environment variables ([a349584](https://github.com/getappmap/appmap-js/commit/a34958480f36690c39515b6413cf335334b0ddc6))

# [@appland/navie-v1.3.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.2.1...@appland/navie-v1.3.0) (2024-03-25)


### Bug Fixes

* Store AI responses as 'assistant' messages ([111af69](https://github.com/getappmap/appmap-js/commit/111af690a955c02fe157420a4d6ff323d8a3b987))
* Update appmap-node ([ed9b10f](https://github.com/getappmap/appmap-js/commit/ed9b10f6e0d205199579643d31153a224b226ed9))


### Features

* Increase the ratio of code to sequence diagrams ([1717eb9](https://github.com/getappmap/appmap-js/commit/1717eb95706fc97a16b10096ab5c5446730f00cc))

# [@appland/navie-v1.2.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.2.0...@appland/navie-v1.2.1) (2024-03-21)


### Bug Fixes

* Linter fixes ([c74989a](https://github.com/getappmap/appmap-js/commit/c74989af48d310cd83f63a5b22c073e9b156b5ad))

# [@appland/navie-v1.2.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.1.0...@appland/navie-v1.2.0) (2024-03-18)


### Bug Fixes

* Vector term parse error ([e6976ea](https://github.com/getappmap/appmap-js/commit/e6976eab8e5fc02003f7bf2d59b4aaddf994f6bc))


### Features

* Support multi-project ProjectInfo ([2cf9436](https://github.com/getappmap/appmap-js/commit/2cf9436ab3d14fd9a7d72f264cdae0c87d0c8588))
* Update AppMap config and stats prompts ([2e9245e](https://github.com/getappmap/appmap-js/commit/2e9245ecd1848af1a45281b7cc0a9b714bb23bf5))

# [@appland/navie-v1.1.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.0.0...@appland/navie-v1.1.0) (2024-03-06)


### Bug Fixes

* Treat conversation memory as a system prompt ([c3623ee](https://github.com/getappmap/appmap-js/commit/c3623ee075ef251fa625dec78bb606e99c590315))


### Features

* Update prompts for navie and vector-terms ([891f350](https://github.com/getappmap/appmap-js/commit/891f350795d117b5954916c10d10d2ef361ecb78))

# @appland/navie-v1.0.0 (2024-03-04)


### Features

* Add @appland/navie project ([4d6a222](https://github.com/getappmap/appmap-js/commit/4d6a2222ffc9ab9816d8c2ca4d358360220300c1))
* Prompt user to make AppMaps when there are none ([8b71701](https://github.com/getappmap/appmap-js/commit/8b71701882165c3d8d77e56d4a8714a1a32ac230))
