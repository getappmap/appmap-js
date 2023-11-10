# [@appland/components-v3.12.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.11.0...@appland/components-v3.12.0) (2023-11-10)


### Features

* Export sequence diagram with the store ([15f64a2](https://github.com/getappmap/appmap-js/commit/15f64a2ddd5197530baf4cac248de7aad7c832b6))

# [@appland/components-v3.11.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.10.0...@appland/components-v3.11.0) (2023-10-30)


### Features

* **DiagramSequence.vue:** add method to expand ancestors of specific events ([3586cf1](https://github.com/getappmap/appmap-js/commit/3586cf109a7c077a444c2805f8bc12b3d4829616))

# [@appland/components-v3.10.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.9.0...@appland/components-v3.10.0) (2023-10-30)


### Bug Fixes

* **DetailsSearch.vue:** modify condition to push item based on childLeafs length ([b49182b](https://github.com/getappmap/appmap-js/commit/b49182bbee15a0520efc14ed6ad0b8f8b503d372))


### Features

* **VsCodeExtension.vue:** prevent seqDiagramCollapseDepth from exceeding max ([82d15d6](https://github.com/getappmap/appmap-js/commit/82d15d61116d08e4d003a131e4459b9b04d8c9dd))

# [@appland/components-v3.9.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.8.0...@appland/components-v3.9.0) (2023-10-20)


### Bug Fixes

* Prevent duplicate key error from call label ([17ca5ac](https://github.com/getappmap/appmap-js/commit/17ca5ac0fed9cfa9196056de6222ba82eeb487a8))
* Simplify flame graph zoom ([d6d6479](https://github.com/getappmap/appmap-js/commit/d6d6479eef8a2b770af4ffd9dd049eb29817564d))


### Features

* Avoid re-renders in trace by stabilizing props ([a6916e4](https://github.com/getappmap/appmap-js/commit/a6916e4b125ffb2fa57ab63c4699fc6cb1240218))
* Avoid repeated access to computed properties when iterating ([aed2a5d](https://github.com/getappmap/appmap-js/commit/aed2a5db9fbd5ff167cdbd8a5b48f52fac39c85e))
* Avoid unnecessary re-renders when focusing/selecting ([fa438ed](https://github.com/getappmap/appmap-js/commit/fa438ed2011f85d51e47aefd6be1969352fbdfbe))
* Make details panel list header a functional component ([a10994b](https://github.com/getappmap/appmap-js/commit/a10994b35f8686b2967e5311c1b11b05d9d4acff))
* Make flamegraph item a functional component ([b5cb23f](https://github.com/getappmap/appmap-js/commit/b5cb23f2a387193f47a008e836c1b5c024f4d58a))
* Make loop action a functional component ([530797f](https://github.com/getappmap/appmap-js/commit/530797f5572776b6dd6de667cbe97c0c78fc772e))
* Make return labels functional components ([646fbef](https://github.com/getappmap/appmap-js/commit/646fbef93e9590a7097fd6067e8f59fef99208ef))
* Remove flame graph prop validators ([635ca93](https://github.com/getappmap/appmap-js/commit/635ca93f12569c57450197e83fafe38fec7cf9dd))
* Show grabbing cursor in flame graph ([83e907e](https://github.com/getappmap/appmap-js/commit/83e907ea637a7b66827e595360d41d389946c4f8))
* Use functional components in trace diagram ([66d9b1d](https://github.com/getappmap/appmap-js/commit/66d9b1d08e45294c1ebc69dddc4f606e15bef7ef))
* Use vuex store for collapsed action state ([a7b13f2](https://github.com/getappmap/appmap-js/commit/a7b13f241642fc3850db46b45b8553422747c566))

# [@appland/components-v3.8.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.7.0...@appland/components-v3.8.0) (2023-10-06)


### Bug Fixes

* Ensure that max collapse depth is updated ([e778f2a](https://github.com/getappmap/appmap-js/commit/e778f2a53f49379eee26f37dbaa3df6ec2232557))
* Get actors without building a complete seq diagram ([81dbcac](https://github.com/getappmap/appmap-js/commit/81dbcac0166c0ba859c4e5427bc7aae960c45990))
* Prevent errors on initial load in vs code ([2273b82](https://github.com/getappmap/appmap-js/commit/2273b824fea5f67663dac457b60046623034fc8b))


### Features

* Simplify action/actor key computation ([2041f59](https://github.com/getappmap/appmap-js/commit/2041f5906640aacf8e74730daca9ccf22392ca2f))

# [@appland/components-v3.7.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.6.0...@appland/components-v3.7.0) (2023-10-04)


### Features

* Sequence diagram auto collapses actions on startup ([#1401](https://github.com/getappmap/appmap-js/issues/1401)) ([5452fb1](https://github.com/getappmap/appmap-js/commit/5452fb19a2a1f99cfc16c638e5c77f396fa1a73f))

# [@appland/components-v3.6.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.5.0...@appland/components-v3.6.0) (2023-10-03)


### Features

* Disable diagram tabs in 'diff' mode ([#1362](https://github.com/getappmap/appmap-js/issues/1362)) ([4607260](https://github.com/getappmap/appmap-js/commit/4607260a75590ca740355b29a6b688a9a0755a3c))

# [@appland/components-v3.5.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.4.0...@appland/components-v3.5.0) (2023-09-25)


### Features

* Hide unused actors when collapsing actions ([#1398](https://github.com/getappmap/appmap-js/issues/1398)) ([3f568f3](https://github.com/getappmap/appmap-js/commit/3f568f36418cd94aa37edcd422683e97435759ad))

# [@appland/components-v3.4.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.3.0...@appland/components-v3.4.0) (2023-09-25)


### Features

* **DetailsSearch.vue:** enhance findings filtering to include message and rule title ([fc0ba26](https://github.com/getappmap/appmap-js/commit/fc0ba2601205ff134b8afb2e11cdd388fcc6f6e2))

# [@appland/components-v3.3.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.2.0...@appland/components-v3.3.0) (2023-09-22)


### Features

* **CallLabel.vue:** add hover effect to display SQL and parameters ([f949a3d](https://github.com/getappmap/appmap-js/commit/f949a3d8374c71b73d1d6422ad522888406ad2b7))

# [@appland/components-v3.2.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.1.0...@appland/components-v3.2.0) (2023-09-19)


### Features

* Add responsive styling for mobile ([7b38061](https://github.com/getappmap/appmap-js/commit/7b38061fb979a2e558ba94c200847098ae2dcb84))

# [@appland/components-v3.1.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v3.0.0...@appland/components-v3.1.0) (2023-09-18)


### Bug Fixes

* The OpenAPI links have been replaced in the sign in page ([ba0675f](https://github.com/getappmap/appmap-js/commit/ba0675f99056b52756ae416c1357904e2223e294))


### Features

* Add a local storage backend for persisting filters ([#1364](https://github.com/getappmap/appmap-js/issues/1364)) ([a5f2c75](https://github.com/getappmap/appmap-js/commit/a5f2c7561bbd7ef2bc4ce06ba4eeacf515348c2d))
* Improved usability when changing filters from the sidebar ([#1381](https://github.com/getappmap/appmap-js/issues/1381)) ([caec1b8](https://github.com/getappmap/appmap-js/commit/caec1b89f9a824b50b5aba23c32d070d8d8e0c32))

# [@appland/components-v3.0.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.62.0...@appland/components-v3.0.0) (2023-09-18)


### Features

* Runtime analysis CTA is now 'view analysis report' ([#1388](https://github.com/getappmap/appmap-js/issues/1388)) ([f583c93](https://github.com/getappmap/appmap-js/commit/f583c93f8396e8ac0d39b7a2a80a28a3df0b6d03))


### BREAKING CHANGES

* The 'view-problems' event has been replaced with
'open-findings-overview'.

# [@appland/components-v2.62.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.61.2...@appland/components-v2.62.0) (2023-09-13)


### Bug Fixes

* Call labels appear at the top in the sequence diagram ([#1367](https://github.com/getappmap/appmap-js/issues/1367)) ([cba74ef](https://github.com/getappmap/appmap-js/commit/cba74eff207ae2409f6b0a7c2ffd07dcd08da873))


### Features

* Hovering over a return in the sequence diagram provides a tooltip containing the return value ([#1363](https://github.com/getappmap/appmap-js/issues/1363)) ([27a06e9](https://github.com/getappmap/appmap-js/commit/27a06e9ba8b49040ad25dda78164c82826ebfb67))

# [@appland/components-v2.61.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.61.1...@appland/components-v2.61.2) (2023-09-12)


### Bug Fixes

* Labels which overflow the sequence diagram are truncated ([#1360](https://github.com/getappmap/appmap-js/issues/1360)) ([f3192f1](https://github.com/getappmap/appmap-js/commit/f3192f1fe031ca1e080848407cb904f1ddf2823a))
* The first lifeline in the sequence diagram now renders at the expected height ([#1365](https://github.com/getappmap/appmap-js/issues/1365)) ([ed80466](https://github.com/getappmap/appmap-js/commit/ed80466199e6923ad4de7b1fd3272ad334eb5fb3))

# [@appland/components-v2.61.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.61.0...@appland/components-v2.61.1) (2023-09-08)


### Bug Fixes

* Long package names are clipped ([71c89ba](https://github.com/getappmap/appmap-js/commit/71c89ba39e3c2e44cd728ffa31d74d763ae34eb1))

# [@appland/components-v2.61.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.60.1...@appland/components-v2.61.0) (2023-09-06)


### Features

* Collapse non-diff-participating Actions ([8525318](https://github.com/getappmap/appmap-js/commit/852531831e072ac3a554405a48b3829065272dd0))
* Enable sequence diagram diff in AppMap ([885239e](https://github.com/getappmap/appmap-js/commit/885239e28dd92db741e76ee6a40247ee15681aa4))
* Scroll to first 'diff' action in SD ([4a79587](https://github.com/getappmap/appmap-js/commit/4a795872a73c744f9b63f33968739f0d308888c7))
* Set default view for precomputed seq diagram ([cb5093d](https://github.com/getappmap/appmap-js/commit/cb5093d4bcd7a8b6e3b994c6eb203d1fb3398c84))
* Suppress hide and expand Actor for SD diff ([293a24f](https://github.com/getappmap/appmap-js/commit/293a24fabf23bc3cd451a4617db8b871a3bbe186))

# [@appland/components-v2.60.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.60.0...@appland/components-v2.60.1) (2023-09-06)


### Bug Fixes

* Apply button in filter dialog is confusing ([5329172](https://github.com/getappmap/appmap-js/commit/53291721aeecf1dd367050b7623cb8683ed7ceb5))

# [@appland/components-v2.60.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.59.0...@appland/components-v2.60.0) (2023-09-01)


### Features

* select finding when map opened from findings webview ([e68dd48](https://github.com/getappmap/appmap-js/commit/e68dd48499fe8ccf94c3b0359350b6c2fb3d5ae9))

# [@appland/components-v2.59.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.58.1...@appland/components-v2.59.0) (2023-08-23)


### Features

* Drop OpenAPI from the onboarding flow ([2dbee5d](https://github.com/getappmap/appmap-js/commit/2dbee5dff12a2888bd3637926fcbcf8ff394b25f))

# [@appland/components-v2.58.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.58.0...@appland/components-v2.58.1) (2023-08-21)


### Bug Fixes

* update java agent jar instructions ([234035d](https://github.com/getappmap/appmap-js/commit/234035d3cd2bd3e51866d2a1d2379a8dca21c519))

# [@appland/components-v2.58.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.57.1...@appland/components-v2.58.0) (2023-08-14)


### Features

* release new version of components ([4999044](https://github.com/getappmap/appmap-js/commit/49990441f56a7e21d94a7adeb01df743ef036c78))

# [@appland/components-v2.57.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.57.0...@appland/components-v2.57.1) (2023-07-26)


### Bug Fixes

* Fix problems in filter deserialization ([b5e0785](https://github.com/getappmap/appmap-js/commit/b5e0785e7d63fdc729518658ba7a4c8a17304fc7))

# [@appland/components-v2.57.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.56.0...@appland/components-v2.57.0) (2023-07-19)


### Bug Fixes

* 'next' button goes to the next step if setup complete ([007043c](https://github.com/getappmap/appmap-js/commit/007043cd1beedcee2fe15e76fa28f8e4897ead5f)), closes [#1245](https://github.com/getappmap/appmap-js/issues/1245)


### Features

* upgrade @appland/models to 2.6.3 ([6e31f9c](https://github.com/getappmap/appmap-js/commit/6e31f9cc179ac0edfcde2861b937cd104ed4c687))

# [@appland/components-v2.56.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.55.0...@appland/components-v2.56.0) (2023-07-13)


### Bug Fixes

* consistent fqids for queries and (external) routes ([5f3e40e](https://github.com/getappmap/appmap-js/commit/5f3e40ead971f7a161890e7fd4c1c6da1fc192d9))
* unsupported projects show helpful information ([7fcbe19](https://github.com/getappmap/appmap-js/commit/7fcbe19a4ebb1f3cd3d5dd45ad3f3adb4d04fb35))


### Features

* Manual instructions instruct the user to create appmap.yml ([5b3bd0c](https://github.com/getappmap/appmap-js/commit/5b3bd0c007bf9c8eddd90f4b41b43a0e153e42d0))

# [@appland/components-v2.55.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.54.0...@appland/components-v2.55.0) (2023-07-12)


### Features

* bump sequence diagram version in components ([e9fd7d2](https://github.com/getappmap/appmap-js/commit/e9fd7d298f1cdca1a99a38d1beb50a8b69b1ccd8))

# [@appland/components-v2.54.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.53.1...@appland/components-v2.54.0) (2023-07-11)


### Bug Fixes

* focused element is centered ([1bafb79](https://github.com/getappmap/appmap-js/commit/1bafb790b70a1091c39e0e3371b56e080070cefc))
* focusedEvent does not call non-existant function ([aacd78a](https://github.com/getappmap/appmap-js/commit/aacd78ac0c02420b7239b8928444e8ad50bb9a8c))
* resetting diagram resets trace filter ([823c2d7](https://github.com/getappmap/appmap-js/commit/823c2d7c1be3834ec8e186588670afecaf715217))


### Features

* highlight events when finding is selected ([be86e9a](https://github.com/getappmap/appmap-js/commit/be86e9a0c8e4924460da7c05d5d5cc1ba9432ca8))

# [@appland/components-v2.53.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.53.0...@appland/components-v2.53.1) (2023-07-11)


### Bug Fixes

* IntelliJ test framework property is of the expected type ([123d36d](https://github.com/getappmap/appmap-js/commit/123d36dbb33014e3da76bc3315c52f79c702403f))
* Remove usage of unknown component ([20e41d0](https://github.com/getappmap/appmap-js/commit/20e41d0aac594ba2402ed6c75cda9da13cd8bde5))

# [@appland/components-v2.53.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.52.3...@appland/components-v2.53.0) (2023-07-07)


### Features

* remove flame graph feature flag ([ee48f88](https://github.com/getappmap/appmap-js/commit/ee48f88b783eba164bc2cf9392a1b8a3ec00f4d7))

# [@appland/components-v2.52.3](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.52.2...@appland/components-v2.52.3) (2023-07-06)


### Bug Fixes

* loop boxes surround calls ([69e0e14](https://github.com/getappmap/appmap-js/commit/69e0e1454b0ff7cba8bcb4b095ae7af55e745cef))


### Reverts

* Revert "fix: correct loop box height" ([76ae018](https://github.com/getappmap/appmap-js/commit/76ae01825f14a491efc06969528287df1dd11271))

# [@appland/components-v2.52.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.52.1...@appland/components-v2.52.2) (2023-07-06)


### Bug Fixes

* external routes are yellow in flame graph ([8988c78](https://github.com/getappmap/appmap-js/commit/8988c78d5e33d640b03783d9835c415c19e72ae1))

# [@appland/components-v2.52.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.52.0...@appland/components-v2.52.1) (2023-07-05)


### Bug Fixes

* VS Code Java doc updates ([68f6241](https://github.com/getappmap/appmap-js/commit/68f6241eec2ba8c0cd5abaae239ec147144ab338))

# [@appland/components-v2.52.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.51.0...@appland/components-v2.52.0) (2023-07-03)


### Bug Fixes

* Add a missing space ([2615952](https://github.com/getappmap/appmap-js/commit/261595250c54b8205cd58785725e83fa9062296f))


### Features

* add default AppMap filter if none exists ([2de2374](https://github.com/getappmap/appmap-js/commit/2de23748e998af4664f554f3a6de2cba5e88938a))
* Update install instructions for AppMap Java in VS Code ([2ff2c40](https://github.com/getappmap/appmap-js/commit/2ff2c40906058a6042b563bde318905c259867e3))

# [@appland/components-v2.51.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.50.0...@appland/components-v2.51.0) (2023-06-29)


### Features

* add drag to flamegraph ([2552d16](https://github.com/getappmap/appmap-js/commit/2552d165f4a57503512e5d73e72a838ee64ada4a))
* add ineratia to grab scroll in flamegraph ([bd0d9fe](https://github.com/getappmap/appmap-js/commit/bd0d9fe3dd9f70af8255e9bab5286a0d0a33f258))
* enable mouse wheel zoom ([109b6e9](https://github.com/getappmap/appmap-js/commit/109b6e975a53b629cb0ed4ceb22502e61c28126f))
* enable scroll flamegraph with trackpad ([8925f6a](https://github.com/getappmap/appmap-js/commit/8925f6a05c97ede1465e6e7b8ac0b874a3c8b69e))
* make the trunk flamegraph sticky ([cdf4202](https://github.com/getappmap/appmap-js/commit/cdf4202d0cf08b2ba707b9c63b6cb8a5b9309c52))
* min zoom to available width ([a53abf4](https://github.com/getappmap/appmap-js/commit/a53abf4e402b305abe3deeec17f74caebf82cc2b))
* show when flamegraph items are clickable ([e794dbf](https://github.com/getappmap/appmap-js/commit/e794dbf1b61e176fc8cc11ffd718b12aea3f3e21))
* show when flamegraph root is clickable ([f90b83a](https://github.com/getappmap/appmap-js/commit/f90b83aa5976bee3cfba856d605d22f2620b946f))
* smooth flamegraph zoom ([b132e26](https://github.com/getappmap/appmap-js/commit/b132e268e3ddb761bf3c767a30d3c029ebdf3ec8))
* update show flamegraph button ([5e3709c](https://github.com/getappmap/appmap-js/commit/5e3709cc26fb9469bbc5ec5af07540bca45ccbd8))
* zoom centering and partial scrolling ([32f6194](https://github.com/getappmap/appmap-js/commit/32f61942a967b6d4bcd8693abec7c67baf4d66a1))


### Performance Improvements

* class-based FlamegraphItem dimensions ([5bf4d30](https://github.com/getappmap/appmap-js/commit/5bf4d30c3f632390fd0c3f66cff1092a07648346))
* faster focus-related update in flamegraph ([06c7029](https://github.com/getappmap/appmap-js/commit/06c702904884fe3ae264e1293e8b5e07546434aa))
* static flamegraph factor ([771fb6c](https://github.com/getappmap/appmap-js/commit/771fb6cbb0b53f8b863932b9dbf9df99147bd438))

# [@appland/components-v2.50.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.49.0...@appland/components-v2.50.0) (2023-06-23)


### Bug Fixes

* handle 0 sum children in flamegraph ([c36f300](https://github.com/getappmap/appmap-js/commit/c36f3000b8fafdda4b2dd3c184bf5809d55ef8fd))


### Features

* add 'show in flamegraph' button ([510fc01](https://github.com/getappmap/appmap-js/commit/510fc015991287747231b7d274c530cb5113dae1))
* add duration to flamegraph items ([3e964d7](https://github.com/getappmap/appmap-js/commit/3e964d773de423415aa39e9106667ab22bb608c2))
* differentiate events type in flamegraph ([e5de00e](https://github.com/getappmap/appmap-js/commit/e5de00e5c360c4e6d03c33504854bc9899f9abf9))
* exponential zoom ([6906847](https://github.com/getappmap/appmap-js/commit/6906847c2799ef3f2bdef0593babe62ac805fe5e))
* flamegraph uses tab scroll instead of its own ([361bd67](https://github.com/getappmap/appmap-js/commit/361bd671fef1083031dfd1b18bf2451540701ea6))
* grey out rest box ([10e0c89](https://github.com/getappmap/appmap-js/commit/10e0c89f7d100b2a9eeb152b4b233b71b0d07b99))
* grey out the trunc of the flamegraph ([b58191e](https://github.com/getappmap/appmap-js/commit/b58191e49ce76e249a482238cbbeeb5ae8b9df7b))
* implement flamegraph as vue components ([646dea1](https://github.com/getappmap/appmap-js/commit/646dea1975d86c1e514f7de8cf94d85e38ba8c37))
* label hovered event ([c63a6e3](https://github.com/getappmap/appmap-js/commit/c63a6e3e695565f27ba43d29d36c7010981af038))
* metric and exponential duration format ([07ca5f2](https://github.com/getappmap/appmap-js/commit/07ca5f27159cef12c29a9358b7ecddfadfe6f0f5))

# [@appland/components-v2.49.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.48.0...@appland/components-v2.49.0) (2023-06-22)


### Bug Fixes

* Allow 'Copied to clipboard!' messages to overflow ([28bb34a](https://github.com/getappmap/appmap-js/commit/28bb34a3da12ff5309f131438835f3bcb84078c2))
* Move AppMaps to the top of Explore AppMaps ([5b54bff](https://github.com/getappmap/appmap-js/commit/5b54bff2a48d323b53224e2d85738fe4b36ddd67))
* Only expand projects when clicking headers ([1c3f593](https://github.com/getappmap/appmap-js/commit/1c3f5930cbddd12323b860191af8cef0566bdd03))
* Record AppMaps displays the total number of AppMaps ([430fbbc](https://github.com/getappmap/appmap-js/commit/430fbbcf512c58613acc918168e41cf63d0830ec))


### Features

* Add a status component ([60e35e9](https://github.com/getappmap/appmap-js/commit/60e35e9f0d7ce58e58a76fefd79c6388d052f0db))
* Integrate the status bar into the instructions ([a54addc](https://github.com/getappmap/appmap-js/commit/a54addc4814d25d68c994e10eb755b6afdf5c425))
* Re-style the primary button ([e2041f8](https://github.com/getappmap/appmap-js/commit/e2041f892ba0287ebb9e591e0ec425a5f5296ed4))
* Rework primary actions in instructions ([d8009bd](https://github.com/getappmap/appmap-js/commit/d8009bdafcbc7b8e8a1562b4453ae3a99773700a))

# [@appland/components-v2.48.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.47.0...@appland/components-v2.48.0) (2023-06-17)


### Features

* Add instructions for Java in VSCode ([#1233](https://github.com/getappmap/appmap-js/issues/1233)) ([2173c38](https://github.com/getappmap/appmap-js/commit/2173c38254f167a8693df48518531b126ec75b2b))

# [@appland/components-v2.47.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.46.2...@appland/components-v2.47.0) (2023-06-14)


### Bug Fixes

* Cleanup per lint ([bccc3d7](https://github.com/getappmap/appmap-js/commit/bccc3d7c81b5af6041cff569f74742f3d6a1be63))
* Fix appmap record prompt ([a6366c5](https://github.com/getappmap/appmap-js/commit/a6366c5779294e2b2e604dbc53a018d3f2de4e7b))
* gsub appmap-agent.jar to appmap.jar ([a3e8ba2](https://github.com/getappmap/appmap-js/commit/a3e8ba290cb8b6e9fc6dbd66b9afe93204429f3e))
* Remove instructions to run non-existant Python script ([3cbde9f](https://github.com/getappmap/appmap-js/commit/3cbde9f46e8417fe33f7ecfb60e8f6d2c1ebe1aa))


### Features

* formatting for install instructions ([#1227](https://github.com/getappmap/appmap-js/issues/1227)) ([c27afb9](https://github.com/getappmap/appmap-js/commit/c27afb931d55276a32dfa044a6f3b9df65b4d9f0))
* Project supported if language supported ([4a8f19a](https://github.com/getappmap/appmap-js/commit/4a8f19af9f799cc5b6c3c6df97770b70edf26b79))
* Record instructions styling ([#1222](https://github.com/getappmap/appmap-js/issues/1222)) ([c259715](https://github.com/getappmap/appmap-js/commit/c259715bddac4d78b93843573b92dd14a911afa8))
* Remove feature flag for Python record-by-default ([0f7712c](https://github.com/getappmap/appmap-js/commit/0f7712c586e96aa963e82b1f3c65f3872f8e4399))
* Update install instructions ([fcbbba4](https://github.com/getappmap/appmap-js/commit/fcbbba49d2153c986ddc230e4f1efe0c6680ba74))
* Update Record AppMaps instructions content ([cf3041b](https://github.com/getappmap/appmap-js/commit/cf3041bb3f4e630be7cb0f033de6fec53dd05b33))

# [@appland/components-v2.46.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.46.1...@appland/components-v2.46.2) (2023-06-14)


### Bug Fixes

* self-call and lane-separator colors ([a3ea368](https://github.com/getappmap/appmap-js/commit/a3ea36828e6c89175b0cde3197f6e50f1bd479bc))

# [@appland/components-v2.46.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.46.0...@appland/components-v2.46.1) (2023-06-06)


### Bug Fixes

* update diagrams to 1.7.0 ([c4baced](https://github.com/getappmap/appmap-js/commit/c4baced2fbceeeda58fe01777604ce8a70c3a09d))

# [@appland/components-v2.46.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.45.1...@appland/components-v2.46.0) (2023-06-06)


### Features

* consistent map color palette ([19ef694](https://github.com/getappmap/appmap-js/commit/19ef694e0449469700d81ab2bdd7065349c5409c))

# [@appland/components-v2.45.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.45.0...@appland/components-v2.45.1) (2023-06-05)


### Bug Fixes

* Remove deprecated install-guide SignIn view ([750139d](https://github.com/getappmap/appmap-js/commit/750139d330a3813e0559cc9f93c229bec321b893))

# [@appland/components-v2.45.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.44.0...@appland/components-v2.45.0) (2023-06-02)


### Features

* user can save filter settings ([763c246](https://github.com/getappmap/appmap-js/commit/763c246297d1a1c6516577d9a6d4f49295c36b70))

# [@appland/components-v2.44.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.43.0...@appland/components-v2.44.0) (2023-05-31)


### Features

* add flame graph tab to main view ([7e60136](https://github.com/getappmap/appmap-js/commit/7e6013680e9ca7e2e22b96baabdde350f11d6eb8))
* hide flame graph tab behind a flag ([fc9fea2](https://github.com/getappmap/appmap-js/commit/fc9fea2066571890192c2199dee11d84e9847479))
* implement basic flame graph diagram ([c699891](https://github.com/getappmap/appmap-js/commit/c6998918a403342c06deda35d2cffad136c70941))

# [@appland/components-v2.43.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.42.0...@appland/components-v2.43.0) (2023-05-16)


### Features

* add hide external code filter option ([4b44440](https://github.com/getappmap/appmap-js/commit/4b44440c5409058eb0eac8646a460d7447a0bfbc))

# [@appland/components-v2.42.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.41.1...@appland/components-v2.42.0) (2023-05-10)


### Features

* expand packages to classes in seq diagram ([9c69ac7](https://github.com/getappmap/appmap-js/commit/9c69ac720dff099afc6f92d8ac45e38a9e1c11aa))

# [@appland/components-v2.41.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.41.0...@appland/components-v2.41.1) (2023-05-08)


### Bug Fixes

* bump models to 2.6.0 in components ([c772134](https://github.com/getappmap/appmap-js/commit/c77213493900b7ebb5add01343ff54c0d4c1169d))

# [@appland/components-v2.41.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.40.0...@appland/components-v2.41.0) (2023-05-05)


### Features

* remove accordion and relocate security-faq link ([7d5ea81](https://github.com/getappmap/appmap-js/commit/7d5ea813aa487475bedb526543c36e0d63f95a53))

# [@appland/components-v2.40.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.39.0...@appland/components-v2.40.0) (2023-04-28)


### Features

* Provide filter serialization in @appland/models ([35ed9c0](https://github.com/getappmap/appmap-js/commit/35ed9c0c5bf17e4239d6098ece5ea9b907472c3f))

# [@appland/components-v2.39.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.38.0...@appland/components-v2.39.0) (2023-04-28)


### Features

* add not ready to sign in links ([c032f51](https://github.com/getappmap/appmap-js/commit/c032f5191049150082ef5162f0b340b3c8513cc9))

# [@appland/components-v2.38.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.37.0...@appland/components-v2.38.0) (2023-04-13)


### Features

* tooltips for map controls ([237cc3a](https://github.com/getappmap/appmap-js/commit/237cc3a0d71a855ae27c35b2b7f42ae6c475591d))
* update sidebar sign-in messaging ([03a3c89](https://github.com/getappmap/appmap-js/commit/03a3c89ce2bc13b6e8732d1bb6955417494594ad))

# [@appland/components-v2.37.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.36.0...@appland/components-v2.37.0) (2023-04-05)


### Features

* remove new badge from sequence diagram tab ([522ceb6](https://github.com/getappmap/appmap-js/commit/522ceb630e68b86582c74fa98ac5d244aded44dc))
* switch sign-in button from pink to blue ([deffbad](https://github.com/getappmap/appmap-js/commit/deffbad95156fcad1221f657f0ae17ab73f0bf8e))

# [@appland/components-v2.36.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.35.0...@appland/components-v2.36.0) (2023-03-31)


### Features

* update @appland/models to 2.4.2 ([4691796](https://github.com/getappmap/appmap-js/commit/469179691b5611fdb821f685e740b77c1747588f))

# [@appland/components-v2.35.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.34.0...@appland/components-v2.35.0) (2023-03-31)


### Features

* display notifications for auto-pruned map ([2a169a8](https://github.com/getappmap/appmap-js/commit/2a169a87fdf0c14e81f9b87ae2940f7944fb1d23))
* open stats panel from sidebar notification ([ba1ddd8](https://github.com/getappmap/appmap-js/commit/ba1ddd833c3d281cc3717f5a923e5f6be8f44149))
* show only the stats panel for giant appmaps ([ab361f1](https://github.com/getappmap/appmap-js/commit/ab361f1f0ffee1c05327c56cefbaae580d8baec0))

# [@appland/components-v2.34.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.33.2...@appland/components-v2.34.0) (2023-03-23)


### Features

* Add stats panel to AppMap viewer ([#1117](https://github.com/getappmap/appmap-js/issues/1117)) ([dac8fcd](https://github.com/getappmap/appmap-js/commit/dac8fcdd956fcaed67e85ebc28d73c173054cbf9))

# [@appland/components-v2.33.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.33.1...@appland/components-v2.33.2) (2023-03-22)


### Bug Fixes

* Upgrade @appland/models to v2.4.0 ([dee51b1](https://github.com/getappmap/appmap-js/commit/dee51b1ade14d96a5e6220c24a2b5f064b74e197))

# [@appland/components-v2.33.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.33.0...@appland/components-v2.33.1) (2023-03-21)


### Bug Fixes

* Upgrade @appland/sequence-diagram to v1.5.0 ([302a9ae](https://github.com/getappmap/appmap-js/commit/302a9ae7656fd00e63c3bff6207095108917a6a9))

# [@appland/components-v2.33.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.32.1...@appland/components-v2.33.0) (2023-03-16)


### Bug Fixes

* Restore serializedDiagram to its proper place ([0a04dd4](https://github.com/getappmap/appmap-js/commit/0a04dd458602630a4ade1d9640e2255fb0616da9))


### Features

* Filter out code from outside the source tree ([22dfb51](https://github.com/getappmap/appmap-js/commit/22dfb519e747eb4f3828a83ec392cebf8619f6c8))
* Sequence diagram can render without interactive elements ([9f81cc4](https://github.com/getappmap/appmap-js/commit/9f81cc4c258ff6cbdc1e5433f763b74bcacf816b))

# [@appland/components-v2.32.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.32.0...@appland/components-v2.32.1) (2023-03-10)


### Bug Fixes

* remove assert and util from vue code ([0af4d95](https://github.com/getappmap/appmap-js/commit/0af4d9508bc6328f357182ece4176850d9df38a4))


### Reverts

* Revert "test: fix broken sequence diagram test" ([c916654](https://github.com/getappmap/appmap-js/commit/c916654757df982f0dbb6d8f2520bf85df6f4358))

# [@appland/components-v2.32.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.31.1...@appland/components-v2.32.0) (2023-03-07)


### Bug Fixes

* consistent styling for export and share buttons ([dcac59a](https://github.com/getappmap/appmap-js/commit/dcac59a973d93e90a797248a13df1ad3d47866ad))
* hide actor is visible with really long actor names ([1417ba7](https://github.com/getappmap/appmap-js/commit/1417ba7c578548e50200c1a864d9ca4a05863380))
* keep font white in NEW badge ([f35bf5f](https://github.com/getappmap/appmap-js/commit/f35bf5fd5e8171b85fb8f6d6ff35285d6d01a82e))


### Features

* add general feedback prompt to sidebar ([c867877](https://github.com/getappmap/appmap-js/commit/c867877200e59801b892b7efb8929e0fa5f09280))
* add NEW badge to sequence diagram tab ([bdd7662](https://github.com/getappmap/appmap-js/commit/bdd7662a43136be3d7f967b58de17cd94a822c47))
* sequence diagram feedback prompt after 1 minute ([3982f5f](https://github.com/getappmap/appmap-js/commit/3982f5f842c3129cea9e16bcdffd4f504ada0235))
* sequence diagram legend ([951e2a8](https://github.com/getappmap/appmap-js/commit/951e2a8afbf652caa4389bff0b287b77084d1b69))

# [@appland/components-v2.31.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.31.0...@appland/components-v2.31.1) (2023-02-25)


### Bug Fixes

* update internal dependencies for sequence diagram release ([4f6ddeb](https://github.com/getappmap/appmap-js/commit/4f6ddebedf3ecdfb18429ddca5a117e91498bc5c))

# [@appland/components-v2.31.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.30.0...@appland/components-v2.31.0) (2023-02-24)


### Bug Fixes

* Better space above call action labels ([82f2737](https://github.com/getappmap/appmap-js/commit/82f27372b7020e84d4e06006536c6584ad3ac2f5))
* Collapse first action properly ([912f119](https://github.com/getappmap/appmap-js/commit/912f119caebf814a678cef65f4ef30a38b0fe51c))
* controls in header are responsive for small screens ([fd67832](https://github.com/getappmap/appmap-js/commit/fd678324f0198fcd6c893a60ab43218edd4a3b09))
* correct loop box height ([0616fcb](https://github.com/getappmap/appmap-js/commit/0616fcbc58866249f4ed9ce7400e0a4b00fdf712))
* correctly hide external services ([1769e03](https://github.com/getappmap/appmap-js/commit/1769e03cdd001c1b5bdda34d554511d4f8c06edb))
* correctly highlight self-call items ([9f19614](https://github.com/getappmap/appmap-js/commit/9f19614fd1e9b417614d2762c9a0548ed0cc717a))
* correctly pan to selected items in sequence diagram ([5fc2428](https://github.com/getappmap/appmap-js/commit/5fc242833926733b1df266aa16092c01489f99e6))
* correctly render events in external services ([8b3440b](https://github.com/getappmap/appmap-js/commit/8b3440b3ed8ef0790c0193ad7e49c74648a55b84))
* Eliminate phantom actions during filtering ([2bfc3f3](https://github.com/getappmap/appmap-js/commit/2bfc3f3befca5f19ddf5c6dcaa99c53e04118fe0))
* Extend background color to the whole diagram ([d5e4f77](https://github.com/getappmap/appmap-js/commit/d5e4f775aa41255361d461559bc4cf33dd775164))
* Fix "Show in Trace" tests ([2887fad](https://github.com/getappmap/appmap-js/commit/2887fad454b046bb2fc39e15b079eec98451d364))
* Fix focus highlighting ([29a4e28](https://github.com/getappmap/appmap-js/commit/29a4e28b040390fad47e5678184762b9e12d5317))
* fix inconsistent border-radius for selected elements ([43dee5e](https://github.com/getappmap/appmap-js/commit/43dee5e91ca913d6076a58c272e28b7c4bffcb5c))
* fix linter error ([09b5169](https://github.com/getappmap/appmap-js/commit/09b51697d99c6bb2a71f37fbdc7267e405bdbef3))
* fix view in trace button ([aad0e79](https://github.com/getappmap/appmap-js/commit/aad0e79c495501da620064e69cb9561f11781289))
* Hide loops with no visible children ([f4639f7](https://github.com/getappmap/appmap-js/commit/f4639f7768dc98bc5c659a3ecda582a197a583a0))
* lifeline boxes render correctly in svg export ([0215324](https://github.com/getappmap/appmap-js/commit/0215324aaf909822588426bb3deefd5dc492d596))
* loop box width is correct ([bd39227](https://github.com/getappmap/appmap-js/commit/bd392275cac670db0dbccf766401e3f889a0b0d3))
* Overlying divs don't block click events ([ef05af1](https://github.com/getappmap/appmap-js/commit/ef05af15e2920ba53e92798341aed7f500e6de60))
* prevent tabs from disappearing ([b3cab9c](https://github.com/getappmap/appmap-js/commit/b3cab9c1daf763bd8c7c86427df462f1caf95586))
* prevent vertical scrolling when selecting actor ([08ce08f](https://github.com/getappmap/appmap-js/commit/08ce08f0038158ca06293e1bd601433644ee6077))
* Provide call arrows of the proper color ([3836393](https://github.com/getappmap/appmap-js/commit/3836393911e79a932d3f76d6f598002b43c11cf7))
* Re-render seq diagram on change ([6ac550c](https://github.com/getappmap/appmap-js/commit/6ac550c784fdef78894e71512b42c1fde264b0e6))
* Remove black background behind text ([5af92cf](https://github.com/getappmap/appmap-js/commit/5af92cfb5b5e1a6533d94bcf2fde49f4faf588d7))
* remove control elements from export ([692f47e](https://github.com/getappmap/appmap-js/commit/692f47eb322cc01d9f4fe89f494174f3213bf6d1))
* Reset elapsed time filter on Reset click ([c0cb401](https://github.com/getappmap/appmap-js/commit/c0cb40124b6b90ed656e1d41894dddd2550e36b4))
* Scope CSS of Trace diff ([fb0c83d](https://github.com/getappmap/appmap-js/commit/fb0c83d8b6623edd86b6fec5797dbd40ade29a77))
* Sequence diagram displays selected event ([db0a271](https://github.com/getappmap/appmap-js/commit/db0a27172d3fad767ba688dedaa243095fca8f89))
* temporarily hide undesired DOM elements for export ([8b62947](https://github.com/getappmap/appmap-js/commit/8b62947bba9d0563c95578da0d2de3225243d015))
* update styling for animation when clicking eyeball ([4d339ef](https://github.com/getappmap/appmap-js/commit/4d339ef3ab2a7d150784066c2031f81289456a34))
* use props instead of store for filtered map ([185af30](https://github.com/getappmap/appmap-js/commit/185af30dcc6004b5bc2b023c6e8a06f02bf5d810))
* view in trace works after hiding actors ([8acc3f2](https://github.com/getappmap/appmap-js/commit/8acc3f2bf3c70daf0be02d0008aeaa7eaef6a2ce))


### Features

* Add sequence diagram as AppMap tab ([a526f21](https://github.com/getappmap/appmap-js/commit/a526f21ca5fa041d7b455b5baa6c4e244d34a888))
* Add sequence diagram CSS variables ([414edc3](https://github.com/getappmap/appmap-js/commit/414edc303de72bef31238877dddbd3e96568f00e))
* Add text styling ([bc6a477](https://github.com/getappmap/appmap-js/commit/bc6a47758b87ce6099a74a51e92eb7fcba33ffec))
* Display 'self call' arrows ([41ce9dd](https://github.com/getappmap/appmap-js/commit/41ce9dd2ef581279219e55713f524a24cfdfc84a))
* Display action returns in italics ([501c4f1](https://github.com/getappmap/appmap-js/commit/501c4f15f88386041cc4867e80a56d42b18a9f76))
* Download sequence diagram as SVG ([47ec345](https://github.com/getappmap/appmap-js/commit/47ec3456c841854cfd1982f547f7cb2430d9a71f))
* Draw lifespan / gutter effect ([4c38207](https://github.com/getappmap/appmap-js/commit/4c382071e48a72e08c404ac62fc81609b9f4083c))
* Expand and collapse actions ([3727f81](https://github.com/getappmap/appmap-js/commit/3727f8192bb3a844a6e64bcd1d3f2c382a6c5b5b))
* Hide package with a button in the Actor box ([23d7c75](https://github.com/getappmap/appmap-js/commit/23d7c75d8f494ca6c333c93c7e91985511f8c6ad))
* Highlight selected event in sequence diagram ([adff3d1](https://github.com/getappmap/appmap-js/commit/adff3d164384e08bcb36d190607262b27cc766e5))
* Highlight selected events in seq diagram ([56c4a92](https://github.com/getappmap/appmap-js/commit/56c4a92abafd7d15b53d365f00801b020ef8cefc))
* Initial view can be sequence diagram ([0fe1328](https://github.com/getappmap/appmap-js/commit/0fe13282334e857a40569b04b95c25d690a6fffb))
* Introduce VDiffChannel component ([5a57bc2](https://github.com/getappmap/appmap-js/commit/5a57bc2a11826f0d36742c379fc12f7708e6ec5f))
* Make Actor row configurable ([49b2f30](https://github.com/getappmap/appmap-js/commit/49b2f30298e0adb35824eb71050f605944feabcc))
* Move AppMapFilter to @appland/models ([17ef95b](https://github.com/getappmap/appmap-js/commit/17ef95be62adb82222d4357b4d80e943e96abf7e))
* Proper lifecycle gutter width and group v-spacing ([a13567c](https://github.com/getappmap/appmap-js/commit/a13567c22aaf4b2e40fdf3dbd309d3064d17f05c))
* Proper shape and description for Loop ([7e091fc](https://github.com/getappmap/appmap-js/commit/7e091fc1ac44f8a94aec4f42f69c25b5ca0a1f21))
* Render diff for call return ([e97a038](https://github.com/getappmap/appmap-js/commit/e97a03883e3a8b1da57b6ee56e863484f4ff8fbd))
* Render loops ([79cdd52](https://github.com/getappmap/appmap-js/commit/79cdd52c222ef6c9d0459e9e8685930a71f812d7))
* Render seq diagram diff ([18f2430](https://github.com/getappmap/appmap-js/commit/18f243034e8e5ceb35b256f6125cd3d2a3246fd0))
* Select an action in the seq diagram ([1996d46](https://github.com/getappmap/appmap-js/commit/1996d46d5b1c74e3c42472385ab3f7a146246d1c))
* Selected Actor scrolls into view ([cf75e97](https://github.com/getappmap/appmap-js/commit/cf75e97c2a25ec38d55d8db996c459618fba2542))
* send exported svg to vs code ([84ebddd](https://github.com/getappmap/appmap-js/commit/84ebdddce174d3043ebe6419656639efc327a18f))
* Sequence diagram component ([e4c530b](https://github.com/getappmap/appmap-js/commit/e4c530b6cc9a80bb4477ea501cbbc92641ec7310))
* Underline static functions ([8d4384a](https://github.com/getappmap/appmap-js/commit/8d4384aece3ee2e30c417f9d40f1aa24be161f5b))

# [@appland/components-v2.30.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.29.0...@appland/components-v2.30.0) (2023-02-22)


### Features

* component for sidebar sign-in page ([5c18782](https://github.com/getappmap/appmap-js/commit/5c18782dccae16a61a121aefa199d87697448d27))

# [@appland/components-v2.29.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.28.0...@appland/components-v2.29.0) (2023-02-07)


### Features

* update wording for analysis CTA in web view ([15320d8](https://github.com/getappmap/appmap-js/commit/15320d8da6270b23502cae200b004810f13645be))

# [@appland/components-v2.28.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.27.1...@appland/components-v2.28.0) (2023-02-02)


### Bug Fixes

* Update [@appland](https://github.com/appland) deps ([fb4d442](https://github.com/getappmap/appmap-js/commit/fb4d442d1570f5fddbb08dfed78c9acfa63db1a0))


### Features

* update share icon ([d778b31](https://github.com/getappmap/appmap-js/commit/d778b317bf9b48fae5628aa20d942f341e27ef82))

# [@appland/components-v2.27.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.27.0...@appland/components-v2.27.1) (2023-02-01)


### Bug Fixes

* Upgrade @appland/models to v2.0.0 ([68dea5a](https://github.com/getappmap/appmap-js/commit/68dea5a0a0e313d6067acfda99281a0194b2d353))

# [@appland/components-v2.27.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.26.0...@appland/components-v2.27.0) (2023-02-01)


### Features

* add telemetry to better understand sign in ([7fe4972](https://github.com/getappmap/appmap-js/commit/7fe4972400f379f39b98ea9cff790e43f13d3363))

# [@appland/components-v2.26.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.25.2...@appland/components-v2.26.0) (2023-01-24)


### Features

* update success message styling ([b32181b](https://github.com/getappmap/appmap-js/commit/b32181bcd01d31a4fce367479b162fcdcd769f5a))

# [@appland/components-v2.25.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.25.1...@appland/components-v2.25.2) (2023-01-20)


### Bug Fixes

* revert sidebar updates ([60cdda3](https://github.com/getappmap/appmap-js/commit/60cdda3a1ec44a29d2f65685df83ca2ac8b21949))

# [@appland/components-v2.25.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.25.0...@appland/components-v2.25.1) (2023-01-19)


### Bug Fixes

* do not run components tests on windows ([ff3b0c2](https://github.com/getappmap/appmap-js/commit/ff3b0c24f2f5ac7999bdb20a5dfdfb243a03b0d3))
* run components tests in ci ([1039d0a](https://github.com/getappmap/appmap-js/commit/1039d0a5020cf4a5b6f8f2fd298fad97e794ff22))

# [@appland/components-v2.25.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.24.0...@appland/components-v2.25.0) (2023-01-17)


### Features

* update text on runtime analysis overview ([618fb66](https://github.com/getappmap/appmap-js/commit/618fb66c31071681ccf4f6141c1ce42209155f63))

# [@appland/components-v2.24.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.23.0...@appland/components-v2.24.0) (2023-01-17)


### Features

* appmap sidebar style update ([c119536](https://github.com/getappmap/appmap-js/commit/c1195363c6b905d8c5ba493753d4ce9b78c8a637))

# [@appland/components-v2.23.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.22.0...@appland/components-v2.23.0) (2023-01-17)


### Features

* add terms of service to project picker ([968c0da](https://github.com/getappmap/appmap-js/commit/968c0da65124f601a6e19fb5a55b6514fb5fe4b4))

# [@appland/components-v2.22.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.21.0...@appland/components-v2.22.0) (2023-01-12)


### Features

* style updates for project picker ([0a25917](https://github.com/getappmap/appmap-js/commit/0a25917a6df8c00e6aa5a9de186d4e084aa0f111))

# [@appland/components-v2.21.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.20.1...@appland/components-v2.21.0) (2023-01-11)


### Features

* improve share button in appmap ([fadd2a6](https://github.com/getappmap/appmap-js/commit/fadd2a6ac644907918357865fae6badc88a6db94))

# [@appland/components-v2.20.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.20.0...@appland/components-v2.20.1) (2023-01-05)


### Bug Fixes

* bump [@appland](https://github.com/appland) dependency versions ([ba6005b](https://github.com/getappmap/appmap-js/commit/ba6005bced797c987e5a8528958497e7e72deba3))

# [@appland/components-v2.20.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.19.1...@appland/components-v2.20.0) (2023-01-05)


### Features

* finding info in appmap ([ab75efb](https://github.com/getappmap/appmap-js/commit/ab75efb43710bf91ca98d0fe73bce12e859edcf5))

# [@appland/components-v2.19.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.19.0...@appland/components-v2.19.1) (2022-12-13)


### Bug Fixes

* Update sign in styling to match spec ([da561a4](https://github.com/getappmap/appmap-js/commit/da561a4467c13354473daa542600973459230076))

# [@appland/components-v2.19.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.18.3...@appland/components-v2.19.0) (2022-12-06)


### Bug Fixes

* Export FeatureFlags ([7d050c4](https://github.com/getappmap/appmap-js/commit/7d050c4f03b228de7492b9dacc6b0e37d935dd8d))


### Features

* Add an AppMap sign-in page ([00cacbe](https://github.com/getappmap/appmap-js/commit/00cacbeba0860af67b295d5a1bf185c1d9ed9b25))

# [@appland/components-v2.18.3](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.18.2...@appland/components-v2.18.3) (2022-11-01)


### Bug Fixes

* Alter the condition of AppMaps recorded to require AppMap files on disk ([c68cd15](https://github.com/getappmap/appmap-js/commit/c68cd15b5228195ee44c9108973aa272b00724b0))
* escape paths in npx command ([d3227b2](https://github.com/getappmap/appmap-js/commit/d3227b25ebafdbfdbf658e085a5c1de3c01c04d0))

# [@appland/components-v2.18.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.18.1...@appland/components-v2.18.2) (2022-10-22)


### Bug Fixes

* Single recording prompt can include remote recording ([3189bff](https://github.com/getappmap/appmap-js/commit/3189bffa08fb8882bd08296c92ce76b29d142538))

# [@appland/components-v2.18.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.18.0...@appland/components-v2.18.1) (2022-10-21)


### Bug Fixes

* Java for IntelliJ documents remote recording for recording web server activity ([edd928b](https://github.com/getappmap/appmap-js/commit/edd928ba328bf17f397458cacf27217730f0c7ba))

# [@appland/components-v2.18.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.17.0...@appland/components-v2.18.0) (2022-10-21)


### Features

* Add a feature flag to disable rendering the AppMap record state ([34ab3a1](https://github.com/getappmap/appmap-js/commit/34ab3a141f7d865eb5b97580a321d02b613147fa))
* Document Java + IntelliJ instructions ([16e1932](https://github.com/getappmap/appmap-js/commit/16e1932f689732306b325e308f9746b93dcc8ac7))

# [@appland/components-v2.17.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.16.0...@appland/components-v2.17.0) (2022-10-18)


### Features

* Add pipenv installation instructions ([0c8f7c6](https://github.com/getappmap/appmap-js/commit/0c8f7c64670620586589161c66e887f4c8021a4d))

# [@appland/components-v2.16.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.15.0...@appland/components-v2.16.0) (2022-10-14)


### Features

* Investigate findings now considers three states: analysis enabled, user authenticated and findings enabled in settings ([1829a62](https://github.com/getappmap/appmap-js/commit/1829a62baa434a599623cc310624a42c2caf628b))
* Replace slack signup button with AppMap signup ([c072976](https://github.com/getappmap/appmap-js/commit/c072976b907c69dba8bb17d28c090125187d9049))
* Updated the support CTA ([1411a78](https://github.com/getappmap/appmap-js/commit/1411a781466e94a9c3f6ef063ac18186eed72b50))

# [@appland/components-v2.15.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.14.0...@appland/components-v2.15.0) (2022-10-12)


### Features

* State serialization now ignores defaults and is Base64URL encoded ([4326d05](https://github.com/getappmap/appmap-js/commit/4326d05f8ca1e6de0e5f2ffcd068bd159135b320))

# [@appland/components-v2.14.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.13.1...@appland/components-v2.14.0) (2022-10-11)


### Features

* update appmap share button ([b2a3b91](https://github.com/getappmap/appmap-js/commit/b2a3b91da060e5b792edd792e543ca8805da6b1a))

# [@appland/components-v2.13.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.13.0...@appland/components-v2.13.1) (2022-10-04)


### Bug Fixes

* Add a `featureFlags` prop to toggle automatic recording docs in Python ([12c1058](https://github.com/getappmap/appmap-js/commit/12c1058ce0f136d61c51d465c95fd03187c29f03))
* Hover tooltips will no longer be cut off in the project picker ([4bf770a](https://github.com/getappmap/appmap-js/commit/4bf770a06c106aca4fcac158c9e22c0fafc259f4))
* Updating the projects prop will no longer deselect an active project ([0da03d6](https://github.com/getappmap/appmap-js/commit/0da03d643635c22491ee4a430d975ace4a4b1046))

# [@appland/components-v2.13.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.12.0...@appland/components-v2.13.0) (2022-10-04)


### Bug Fixes

* Projects must have a supported test or web framework to be ([4d8277f](https://github.com/getappmap/appmap-js/commit/4d8277fcada9891c989d35269d6508f4873e36cb))


### Features

* Document automatic recording, remove dependency on NPX for Ruby, Python ([09d98e5](https://github.com/getappmap/appmap-js/commit/09d98e575fedfd2935837ff2bef8153742f850a3))

# [@appland/components-v2.12.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.11.3...@appland/components-v2.12.0) (2022-09-27)


### Features

* Add manual installation instructions for supported languages ([#739](https://github.com/getappmap/appmap-js/issues/739)) ([d67a413](https://github.com/getappmap/appmap-js/commit/d67a4134f571fc74477680b6dc060675c0bf6ec1))

# [@appland/components-v2.11.3](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.11.2...@appland/components-v2.11.3) (2022-09-13)

### Bug Fixes

- remove unused components
  ([a655992](https://github.com/getappmap/appmap-js/commit/a6559924316c198180dc298efa76453982159c62))
- update cypress links in tests
  ([7858309](https://github.com/getappmap/appmap-js/commit/7858309a7153baa9444be04788de95edef4b320e))

# [@appland/components-v2.11.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.11.1...@appland/components-v2.11.2) (2022-09-06)

### Bug Fixes

- Harmonize install guide header styles
  ([202fc4b](https://github.com/getappmap/appmap-js/commit/202fc4b6cd12c82ef6a3b3a964b7a0127e5c163d))

# [@appland/components-v2.11.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.11.0...@appland/components-v2.11.1) (2022-08-17)

### Bug Fixes

- Move OpenAPI instructions before analysis
  ([bb12943](https://github.com/getappmap/appmap-js/commit/bb12943f8448f5c26a164ba4b57a0a2ff1115281))

# [@appland/components-v2.11.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.10.0...@appland/components-v2.11.0) (2022-08-15)

### Features

- add video link to runtime analysis instruction page
  ([15c3ad0](https://github.com/getappmap/appmap-js/commit/15c3ad073cb49d0e0d2bab6cbbf59fbf54da114d))

# [@appland/components-v2.10.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.9.1...@appland/components-v2.10.0) (2022-07-22)

### Features

- show info page when findings not enabled
  ([b7b6857](https://github.com/getappmap/appmap-js/commit/b7b685771e8bbb7e23d65dde5c1abf80464ae881))

# [@appland/components-v2.9.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.9.0...@appland/components-v2.9.1) (2022-07-21)

### Bug Fixes

- Components which expect objects now have proper defaults
  ([aa72ebe](https://github.com/getappmap/appmap-js/commit/aa72ebe4d57218147d194dac3ae7f0d5212526d8))
- Provide a usable default value when no sample code objects are
  ([c4b2c12](https://github.com/getappmap/appmap-js/commit/c4b2c128e082893d4ef3700ce9c47ee6e9403bca))

# [@appland/components-v2.9.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.8.0...@appland/components-v2.9.0) (2022-07-19)

### Features

- show Code Objects in Explore AppMaps webview
  ([53e869d](https://github.com/getappmap/appmap-js/commit/53e869d33f6a95d80fb2d78d33a461c0e85a2885))

# [@appland/components-v2.8.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.7.0...@appland/components-v2.8.0) (2022-07-18)

### Features

- show findings organized by impact domain in investigate findings instruction step
  ([82662c9](https://github.com/getappmap/appmap-js/commit/82662c9651ce0ca264d7d85d82588a9175078dd2))

# [@appland/components-v2.7.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.6.0...@appland/components-v2.7.0) (2022-07-07)

### Bug Fixes

- Add a message for scanned but no findings
  ([c055a65](https://github.com/getappmap/appmap-js/commit/c055a6538fe979bfc450cd780e40bb8513801062))
- Open AppMaps instructions gracefully handles no AppMaps
  ([b84822d](https://github.com/getappmap/appmap-js/commit/b84822deb95ddbe8f74df7aa410286f5f98f7846))

### Features

- Add instructions page for OpenAPI generation
  ([34f50ae](https://github.com/getappmap/appmap-js/commit/34f50ae53680af3070464bf44c8a0d34fa88234f))

# [@appland/components-v2.6.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.5.1...@appland/components-v2.6.0) (2022-06-30)

### Bug Fixes

- re-added stable CSS attribute for tests
  ([ae87017](https://github.com/getappmap/appmap-js/commit/ae87017a6f196f0df975852796cbf7e86e55d111))
- updated message about supported node versions
  ([18f0a53](https://github.com/getappmap/appmap-js/commit/18f0a533dad0768c79ef49cb896ed9e8720201c7))

### Features

- added check for supported node version
  ([037e1fd](https://github.com/getappmap/appmap-js/commit/037e1fd76283685fd51217163056cd0074e4d19e))
- MultiPage now emits an event upon changing pages
  ([cf692c7](https://github.com/getappmap/appmap-js/commit/cf692c7f3f05d23fce4eef426c4915c7c1f7d880))

# [@appland/components-v2.5.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.5.0...@appland/components-v2.5.1) (2022-06-30)

### Bug Fixes

- switch links for python and js
  ([62dd1ef](https://github.com/getappmap/appmap-js/commit/62dd1ef40b6f538ec990f83e46012617c0741080))

# [@appland/components-v2.5.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.4.2...@appland/components-v2.5.0) (2022-06-24)

### Features

- Improved project picker experience ([#633](https://github.com/getappmap/appmap-js/issues/633))
  ([e609928](https://github.com/getappmap/appmap-js/commit/e60992839c2b03b7ed79615889553ac25b14d942))

# [@appland/components-v2.4.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.4.1...@appland/components-v2.4.2) (2022-06-24)

### Bug Fixes

- Only load SQL language for highlight.js
  ([#638](https://github.com/getappmap/appmap-js/issues/638))
  ([85eda58](https://github.com/getappmap/appmap-js/commit/85eda585b7510de6659bca428d00c54e41a39b8a))

# [@appland/components-v2.4.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.4.0...@appland/components-v2.4.1) (2022-06-22)

### Bug Fixes

- Pass disabledLanguages to RecordAppMaps
  ([e8393a2](https://github.com/getappmap/appmap-js/commit/e8393a27de0411c3844a3046aca638b323ebdc02))

# [@appland/components-v2.4.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.3.2...@appland/components-v2.4.0) (2022-06-21)

### Features

- Hide disabled languages in RecordAppMaps
  ([0a300c3](https://github.com/getappmap/appmap-js/commit/0a300c3caacc06c61472f212d8147008682717f5))

# [@appland/components-v2.3.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.3.1...@appland/components-v2.3.2) (2022-06-08)

### Bug Fixes

- Project state is reactive
  ([186775f](https://github.com/getappmap/appmap-js/commit/186775fa0c52274c2f0039956c08bbe983ae8b0d))

# [@appland/components-v2.3.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.3.0...@appland/components-v2.3.1) (2022-06-02)

### Bug Fixes

- "Limit root events to HTTP" filter is now disabled when searching for a hidden root event
  ([#593](https://github.com/getappmap/appmap-js/issues/593))
  ([8962b4a](https://github.com/getappmap/appmap-js/commit/8962b4ad34f7117b159540c69e90bfb90c75fd26))

# [@appland/components-v2.3.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.2.0...@appland/components-v2.3.0) (2022-06-02)

### Bug Fixes

- Add a hover state to links in the install guide
  ([4742780](https://github.com/getappmap/appmap-js/commit/47427804c044620bec8a32501ea8a93345a8a3e0))
- Specify CLI directory with -d argument
  ([e145035](https://github.com/getappmap/appmap-js/commit/e145035b6bad2ec8e045a499973122cd02e4b17b))

### Features

- Pages can be disabled
  ([d77b2ee](https://github.com/getappmap/appmap-js/commit/d77b2ee51325f1def5baf61055e42918b4c07113))

# [@appland/components-v2.2.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.1.1...@appland/components-v2.2.0) (2022-05-26)

### Features

- Add usage guide frontend
  ([90f5afe](https://github.com/getappmap/appmap-js/commit/90f5afec85e49ee794a60dc334eff11f840f9026))

# [@appland/components-v2.1.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.1.0...@appland/components-v2.1.1) (2022-05-18)

### Bug Fixes

- Update source code link prop types ([#590](https://github.com/getappmap/appmap-js/issues/590))
  ([cd8cd20](https://github.com/getappmap/appmap-js/commit/cd8cd206691b2bce34558b0272682d633e418cfb))

# [@appland/components-v2.1.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.0.3...@appland/components-v2.1.0) (2022-05-03)

### Features

- Add link to test file to details panel
  ([#569](https://github.com/getappmap/appmap-js/issues/569))
  ([a6cb5a6](https://github.com/getappmap/appmap-js/commit/a6cb5a62172838efabfc7c55e7a3db4ff82adf8a))

# [@appland/components-v2.0.3](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.0.2...@appland/components-v2.0.3) (2022-04-12)

### Bug Fixes

- Delay mutation of the trace filter until the view has changed
  ([82ad351](https://github.com/getappmap/appmap-js/commit/82ad351e01f83dd1df3c7b5621afb2e43f863a87))

# [@appland/components-v2.0.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.0.1...@appland/components-v2.0.2) (2022-04-12)

### Bug Fixes

- Allow external source URLs to be cached at resolve time
  ([b3ebddd](https://github.com/getappmap/appmap-js/commit/b3ebdddc739140724b5162ae5a11a39f0dbea65e))
- The `viewSource` event was never being emitted
  ([8f90c4b](https://github.com/getappmap/appmap-js/commit/8f90c4bd7dcfd0e88d6c7a3759c45a463e2eb859))
- Use existing colors for view source links
  ([db212c1](https://github.com/getappmap/appmap-js/commit/db212c15f3bef2e771358a455463ffb7decdcc69))

# [@appland/components-v2.0.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v2.0.0...@appland/components-v2.0.1) (2022-04-12)

### Bug Fixes

- Use database hints to format SQL
  ([6c2022b](https://github.com/getappmap/appmap-js/commit/6c2022b79f4d21f51e31be50ac1073c1b8fe3c31))

# [@appland/components-v2.0.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.24.1...@appland/components-v2.0.0) (2022-04-08)

### Bug Fixes

- Drop `view source` from context menu
  ([dcaa770](https://github.com/getappmap/appmap-js/commit/dcaa770f07dfc694a75ee7abbbb1f9c9735d71a3))

### Features

- Improve user feedback for `view source`
  ([e64f272](https://github.com/getappmap/appmap-js/commit/e64f2725ca1bc1e22b02c8f66f4fe85fdb0d47d4))

### BREAKING CHANGES

- This change alters the `viewSource` event emit by the VsCodeExtension view. It now requires the
  owner listen for and respond to a `request-resolve-location` event, providing a raw location to be
  transformed and sent back in a `response-resolve-location` event.

# [@appland/components-v1.24.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.24.0...@appland/components-v1.24.1) (2022-03-10)

### Bug Fixes

- Filter out package children when children are not selected by root
  ([#538](https://github.com/getappmap/appmap-js/issues/538))
  ([38698e5](https://github.com/getappmap/appmap-js/commit/38698e52d9e98c9f50ddaa23935347c2fd03e4f3))

# [@appland/components-v1.24.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.23.0...@appland/components-v1.24.0) (2022-03-01)

### Features

- Add auto-complete suggestions list for Trace view filter
  ([#534](https://github.com/getappmap/appmap-js/issues/534))
  ([4614a3c](https://github.com/getappmap/appmap-js/commit/4614a3ce816871c018cb51e1aeb3270feec263f5))

# [@appland/components-v1.23.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.22.0...@appland/components-v1.23.0) (2022-01-28)

### Bug Fixes

- Object selection is retained when switching filters
  ([d151701](https://github.com/getappmap/appmap-js/commit/d151701311c8ad8002451cd0aaf63067266dec1c))

### Features

- Remove filters if setState selectedObject is not in filtered set
  ([9e81e21](https://github.com/getappmap/appmap-js/commit/9e81e21f10f3139b99880cd9c3f5247ac71e1adf))

# [@appland/components-v1.22.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.21.0...@appland/components-v1.22.0) (2022-01-27)

### Bug Fixes

- Allow selection of events outside the event filter
  ([8f95d58](https://github.com/getappmap/appmap-js/commit/8f95d58e6e760b0e6069abd9ccb773377a65db7f))
- Rename "event" search query to "id"
  ([5418d00](https://github.com/getappmap/appmap-js/commit/5418d0043b2d5eedb171edd5869f5f80271aa961))

### Features

- Add a clear input button to event filter bar
  ([470ae74](https://github.com/getappmap/appmap-js/commit/470ae74866b148f307c34e742ed828ade4e8335f))

# [@appland/components-v1.21.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.20.0...@appland/components-v1.21.0) (2022-01-20)

### Features

- Show filter suggestions when pressing Enter in empty input
  ([#508](https://github.com/getappmap/appmap-js/issues/508))
  ([4cc3a09](https://github.com/getappmap/appmap-js/commit/4cc3a09501810663a9f239a9aff307f6074f283d))

# [@appland/components-v1.20.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.19.0...@appland/components-v1.20.0) (2022-01-12)

### Features

- Add get/set global filters state API ([#509](https://github.com/getappmap/appmap-js/issues/509))
  ([3230f02](https://github.com/getappmap/appmap-js/commit/3230f02d49af864edddcb62139293c1187dadd74))

# [@appland/components-v1.19.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.18.2...@appland/components-v1.19.0) (2022-01-11)

### Features

- Add keyboard navigation for filter suggestions
  ([#492](https://github.com/getappmap/appmap-js/issues/492))
  ([a34216c](https://github.com/getappmap/appmap-js/commit/a34216cfd066f8cf43e6311bc73d435d23bfc671))

# [@appland/components-v1.18.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.18.1...@appland/components-v1.18.2) (2022-01-05)

### Bug Fixes

- Fix sql formatter compatibility
  ([7fc6d20](https://github.com/getappmap/appmap-js/commit/7fc6d206fc2ac0bb30d228bd053fdebe37c008e4))
- Make dependency package versions compatible with scanner
  ([347a4f4](https://github.com/getappmap/appmap-js/commit/347a4f4844cfa89879fbc2154066c4e6eb920786))

# [@appland/components-v1.18.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.18.0...@appland/components-v1.18.1) (2022-01-03)

### Bug Fixes

- Don't hide filters panel after interaction
  ([#507](https://github.com/getappmap/appmap-js/issues/507))
  ([fda5046](https://github.com/getappmap/appmap-js/commit/fda504629cf9ebd8c3f4c90a0a5c9c00255c85a1))

# [@appland/components-v1.18.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.17.3...@appland/components-v1.18.0) (2021-12-23)

### Features

- Highlight all events matching event search
  ([#496](https://github.com/getappmap/appmap-js/issues/496))
  ([1d38bb7](https://github.com/getappmap/appmap-js/commit/1d38bb7b2deb8fcf81ddd948f3943223f3986f99))

# [@appland/components-v1.17.3](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.17.2...@appland/components-v1.17.3) (2021-12-23)

### Bug Fixes

- Set trace container max-width to 100% ([#499](https://github.com/getappmap/appmap-js/issues/499))
  ([7a3c5d4](https://github.com/getappmap/appmap-js/commit/7a3c5d43482a71b3b5b32b6741c604b26edc0f90))

# [@appland/components-v1.17.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.17.1...@appland/components-v1.17.2) (2021-12-17)

### Bug Fixes

- Upgr@appland dependencies
  ([a903535](https://github.com/getappmap/appmap-js/commit/a903535c7fc476881092fbe93b2f3ab69a3a85f7))

# [@appland/components-v1.17.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.17.0...@appland/components-v1.17.1) (2021-12-15)

### Bug Fixes

- remove bottom margin of Trace view filter input
  ([60b4e0d](https://github.com/getappmap/appmap-js/commit/60b4e0d78f459f48cc53c6a9e2c82e860ee41ad4))
- root objects filter suggestions list objects from entire AppMap
  ([bb604b1](https://github.com/getappmap/appmap-js/commit/bb604b116b52feac2361641b140815ea9010790e))

# [@appland/components-v1.17.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.16.0...@appland/components-v1.17.0) (2021-12-02)

### Features

- Filter dependency map and events by label
  ([#475](https://github.com/getappmap/appmap-js/issues/475))
  ([c6ef4c7](https://github.com/getappmap/appmap-js/commit/c6ef4c79ed229b51b9c923cef14cfa67cf775d7b))

# [@appland/components-v1.16.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.15.0...@appland/components-v1.16.0) (2021-12-02)

### Features

- add links for JavaScript docs in Quickstart
  ([b001599](https://github.com/getappmap/appmap-js/commit/b001599180016c23189df103de5ef21d80e3ad57))
- show event exceptions in details panel
  ([dfafe3c](https://github.com/getappmap/appmap-js/commit/dfafe3ce15177b2177e722db2d152b532929ef26))

# [@appland/components-v1.15.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.14.2...@appland/components-v1.15.0) (2021-11-30)

### Features

- Add global filtering and event search ([#429](https://github.com/getappmap/appmap-js/issues/429))
  ([675ecaf](https://github.com/getappmap/appmap-js/commit/675ecafa391c215458f5e56baec511997f501bfd))

# [@appland/components-v1.14.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.14.1...@appland/components-v1.14.2) (2021-10-26)

### Bug Fixes

- Include labels in search query ([#412](https://github.com/getappmap/appmap-js/issues/412))
  ([1e392fa](https://github.com/getappmap/appmap-js/commit/1e392fabd4ab6157f1833209a0477d91176d53f1))

# [@appland/components-v1.14.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.14.0...@appland/components-v1.14.1) (2021-10-21)

### Bug Fixes

- Remove width restriction on qs step ([#428](https://github.com/getappmap/appmap-js/issues/428))
  ([b5d0a3f](https://github.com/getappmap/appmap-js/commit/b5d0a3f3fa6aa86fd08c198196a524c1d7f64a55))

# [@appland/components-v1.14.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.13.2...@appland/components-v1.14.0) (2021-10-19)

### Features

- update styling for details panel
  ([1af8fef](https://github.com/getappmap/appmap-js/commit/1af8fef5f10cead78cf8b80e211fa072eb85e139))
- update styling for search input
  ([a1ce4a9](https://github.com/getappmap/appmap-js/commit/a1ce4a995f8a4b916727dcfb7c441a49ec4f6565))
- update styling for tab menu
  ([b37831c](https://github.com/getappmap/appmap-js/commit/b37831c14e5747880e50c73abe3422a3ecdeea97))

# [@appland/components-v1.13.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.13.1...@appland/components-v1.13.2) (2021-10-15)

### Bug Fixes

- Move install docs command and copied text to props
  ([98abb85](https://github.com/getappmap/appmap-js/commit/98abb853e8fd74380c71e24894e46d0afa9002d0))

# [@appland/components-v1.13.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.13.0...@appland/components-v1.13.1) (2021-10-12)

### Bug Fixes

- "HTTP response details" section was already visible in event details
  ([#408](https://github.com/getappmap/appmap-js/issues/408))
  ([559404d](https://github.com/getappmap/appmap-js/commit/559404d40a3ca051c3e248177fbea395745bfd5a))

# [@appland/components-v1.13.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.12.2...@appland/components-v1.13.0) (2021-10-06)

### Features

- 'Set as root' context menu action is now applied globally
  ([#390](https://github.com/getappmap/appmap-js/issues/390))
  ([e952026](https://github.com/getappmap/appmap-js/commit/e952026ff53f99b0f4fb3dff9e401efdf248c351))

# [@appland/components-v1.12.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.12.1...@appland/components-v1.12.2) (2021-09-20)

### Bug Fixes

- Increase the visibility of the code snippet
  ([b932cdd](https://github.com/getappmap/appmap-js/commit/b932cddc44ad39ede7a1db629b761411376e4328))
- Merge the welcome page with the install page
  ([b478c8f](https://github.com/getappmap/appmap-js/commit/b478c8fc560b4ab5dc3e9941a5de2189322e5258))

# [@appland/components-v1.12.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.12.0...@appland/components-v1.12.1) (2021-09-09)

### Bug Fixes

- Search will always return expected results
  ([#336](https://github.com/getappmap/appmap-js/issues/336))
  ([95b42bc](https://github.com/getappmap/appmap-js/commit/95b42bc32fb8c2c66345ebfc2ebc540a118a1074))

# [@appland/components-v1.12.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.11.0...@appland/components-v1.12.0) (2021-09-03)

### Features

- Add copy button to `CodeSnippet` component
  ([#328](https://github.com/getappmap/appmap-js/issues/328))
  ([89389db](https://github.com/getappmap/appmap-js/commit/89389dbcc561e5a798fba0cd4e23ade2d27bfde5))

# [@appland/components-v1.11.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.10.0...@appland/components-v1.11.0) (2021-09-01)

### Features

- Adjust color and style of the AppMap view
  ([#319](https://github.com/getappmap/appmap-js/issues/319))
  ([7e2df06](https://github.com/getappmap/appmap-js/commit/7e2df06ee2a137e7e378fa78a085b86bd7befd2a))

# [@appland/components-v1.10.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.9.1...@appland/components-v1.10.0) (2021-08-30)

### Features

- Updated design for quickstart docs pages
  ([#322](https://github.com/getappmap/appmap-js/issues/322))
  ([29cddc7](https://github.com/getappmap/appmap-js/commit/29cddc7f07f6f0b7120f608888b188e87b848ab0))

# [@appland/components-v1.9.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.9.0...@appland/components-v1.9.1) (2021-08-27)

### Bug Fixes

- Upgrade @appland/models to v1.5.0, @appland/diagrams to v1.3.1
  ([6150b3b](https://github.com/getappmap/appmap-js/commit/6150b3ba012bf15cb3c4fd442d1bd7d1eb87b2c2))

# [@appland/components-v1.9.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.8.0...@appland/components-v1.9.0) (2021-08-24)

### Features

- Revised quickstart ([#310](https://github.com/getappmap/appmap-js/issues/310))
  ([9c18783](https://github.com/getappmap/appmap-js/commit/9c18783196dac33fed8663b1d81024f1a914fb72))

# [@appland/components-v1.8.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.7.0...@appland/components-v1.8.0) (2021-08-19)

### Features

- Add exceptions to Trace nodes ([#312](https://github.com/getappmap/appmap-js/issues/312))
  ([620d86d](https://github.com/getappmap/appmap-js/commit/620d86d446a9757e6d31b43b0587a5027a58528c))

# [@appland/components-v1.7.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.6.3...@appland/components-v1.7.0) (2021-08-17)

### Features

- Add global filters ([#217](https://github.com/getappmap/appmap-js/issues/217))
  ([3f16612](https://github.com/getappmap/appmap-js/commit/3f16612b7a876f94c81ca0414971c4c455b1a897))

# [@appland/components-v1.6.3](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.6.2...@appland/components-v1.6.3) (2021-08-06)

### Bug Fixes

- Update upload icon ([#262](https://github.com/getappmap/appmap-js/issues/262))
  ([a1f3861](https://github.com/getappmap/appmap-js/commit/a1f386195d365500609f478757a6fe8d5951e704))

# [@appland/components-v1.6.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.6.1...@appland/components-v1.6.2) (2021-08-03)

### Bug Fixes

- Adjust scrolling and padding of Quickstart pages
  ([#301](https://github.com/getappmap/appmap-js/issues/301))
  ([d8f1511](https://github.com/getappmap/appmap-js/commit/d8f15113ce4cc9854a745fb068bcca81743db4c5))

# [@appland/components-v1.6.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.6.0...@appland/components-v1.6.1) (2021-07-30)

### Bug Fixes

- Upgrade models, diagrams dependencies
  ([7aa1a21](https://github.com/getappmap/appmap-js/commit/7aa1a21696b833b8ab533ce2ab459f4bce40f0a1))

# [@appland/components-v1.6.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.5.0...@appland/components-v1.6.0) (2021-07-30)

### Features

- Add Quickstart docs pages 'Install AppMap Agent' and 'Open AppMaps'
  ([#297](https://github.com/getappmap/appmap-js/issues/297))
  ([a2bbd78](https://github.com/getappmap/appmap-js/commit/a2bbd78216547724d8781a21356e7662e6e2f90f))
- Add Quickstart pages for setup ([#267](https://github.com/getappmap/appmap-js/issues/267))
  ([10ab21a](https://github.com/getappmap/appmap-js/commit/10ab21a9847d5a5b63c1d261f308235cab246fba))

# [@appland/components-v1.5.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.4.0...@appland/components-v1.5.0) (2021-06-30)

### Features

- styles for AppMap "View source" link
  ([a46ebeb](https://github.com/getappmap/appmap-js/commit/a46ebeb450901a92075278e898fec807443813e4))
- update Search panel styling
  ([a385b77](https://github.com/getappmap/appmap-js/commit/a385b770f4b915c60aeb248d4b33ad19dbbfefe8))

# [@appland/components-v1.4.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.3.0...@appland/components-v1.4.0) (2021-06-29)

### Features

- show elapsed time in Trace nodes
  ([f96bece](https://github.com/getappmap/appmap-js/commit/f96bece901e581d42e2949a7356d658ef2d150e7))

# [@appland/components-v1.3.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.2.1...@appland/components-v1.3.0) (2021-06-29)

### Features

- updated logo
  ([7826f08](https://github.com/getappmap/appmap-js/commit/7826f08207aa2e6bdb83f37c2c817223c7ac499c))

# [@appland/components-v1.2.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.2.0...@appland/components-v1.2.1) (2021-06-23)

### Bug Fixes

- Upgrade dependencies
  ([6250ff3](https://github.com/getappmap/appmap-js/commit/6250ff3a99c0b2532016610853d60f5dba212672))

# [@appland/components-v1.2.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.1.11...@appland/components-v1.2.0) (2021-06-22)

### Bug Fixes

- Fix a case where an inbound trace connection may be dangling
  ([0cf64be](https://github.com/getappmap/appmap-js/commit/0cf64be9ad77f26eb45559da2d9c5ea6144f529c))

### Features

- HTTP client requests
  ([0c0e833](https://github.com/getappmap/appmap-js/commit/0c0e8338d6d25bf11f73a17d035e2b424e670add))

# [@appland/components-v1.1.11](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.1.10...@appland/components-v1.1.11) (2021-06-21)

### Bug Fixes

- Upgrade @appland/diagrams to v1.1.1 and @appland/models to v1.1.0
  ([5e38093](https://github.com/getappmap/appmap-js/commit/5e38093ca9d0a0e9e97e5900f9d02efa8dfc1989))

# [@appland/components-v1.1.10](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.1.9...@appland/components-v1.1.10) (2021-06-21)

### Bug Fixes

- Trace nodes are always visible after focus
  ([#255](https://github.com/getappmap/appmap-js/issues/255))
  ([5030da6](https://github.com/getappmap/appmap-js/commit/5030da6f66e36cd9efb22e0cacc8dab0cf27ab56))

# [@appland/components-v1.1.9](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.1.8...@appland/components-v1.1.9) (2021-06-16)

### Bug Fixes

- Upgrade @appland/diagrams to v1.1.0
  ([fa83228](https://github.com/getappmap/appmap-js/commit/fa832288b8f776256318952d1e01f53af8860822))

# [@appland/components-v1.1.8](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.1.7...@appland/components-v1.1.8) (2021-06-15)

### Bug Fixes

- Trace ports no longer display incorrect names when AppMap is changed
  ([#253](https://github.com/getappmap/appmap-js/issues/253))
  ([148b72b](https://github.com/getappmap/appmap-js/commit/148b72bfd17e0ef36520e5b1b2d4da886c13c1b9))

# [@appland/components-v1.1.7](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.1.6...@appland/components-v1.1.7) (2021-06-14)

### Bug Fixes

- Trace node panning on focus
  ([105b2ae](https://github.com/getappmap/appmap-js/commit/105b2aea169deeb4ff0485e41aa6f1624740be8d))

# [@appland/components-v1.1.6](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.1.5...@appland/components-v1.1.6) (2021-06-09)

### Bug Fixes

- Upgrade @appland/models, @appland/diagrams
  ([998542f](https://github.com/getappmap/appmap-js/commit/998542fd5950e2b6ce7a4eb71712a5c2089e41fb))

# [@appland/components-v1.1.5](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.1.4...@appland/components-v1.1.5) (2021-06-03)

### Bug Fixes

- Improved cross-browser compatibility for Trace lines
  ([#228](https://github.com/getappmap/appmap-js/issues/228))
  ([1aeea4e](https://github.com/getappmap/appmap-js/commit/1aeea4e2dc64c172f964da966d9d1976be68fac5))
- Pressing enter while focused on the Details search input no longer triggers a form submission
  ([#237](https://github.com/getappmap/appmap-js/issues/237))
  ([f33ff7e](https://github.com/getappmap/appmap-js/commit/f33ff7e3facd9d3a0afd27555ed3bee18edaf98a))

# [@appland/components-v1.1.3](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.1.2...@appland/components-v1.1.3) (2021-05-18)

### Bug Fixes

- Update local dependencies
  ([f0d3281](https://github.com/getappmap/appmap-js/commit/f0d328161499999ee98fbb3aec2d438b3095bd0f))

# [@appland/components-v1.1.2](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.1.1...@appland/components-v1.1.2) (2021-05-18)

### Bug Fixes

- Bundle ESM/CJS without external dependencies
  ([0a38ac0](https://github.com/getappmap/appmap-js/commit/0a38ac0a57baa30c6b0ff00bb69503e4891f8858))

# [@appland/components-v1.1.1](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.1.0...@appland/components-v1.1.1) (2021-05-14)

### Bug Fixes

- Package and export dist/appmap.js
  ([c801d2d](https://github.com/getappmap/appmap-js/commit/c801d2da0d29f6cc54defb4b789bde32e08fce11))

# [@appland/components-v1.1.0](https://github.com/getappmap/appmap-js/compare/@appland/components-v1.0.0...@appland/components-v1.1.0) (2021-05-14)

### Bug Fixes

- Packages share the same color in the details panel and dependency map
  ([#192](https://github.com/getappmap/appmap-js/issues/192))
  ([6564887](https://github.com/getappmap/appmap-js/commit/656488722fb854828f6a7520d749a995df78fc1e))
- Prevent word wrapping in tab buttons ([#193](https://github.com/getappmap/appmap-js/issues/193))
  ([feeb021](https://github.com/getappmap/appmap-js/commit/feeb0217ca9ea06c231857995586f30ed535e94c))
- The details panel will no longer display empty lists
  ([#203](https://github.com/getappmap/appmap-js/issues/203))
  ([270b5b7](https://github.com/getappmap/appmap-js/commit/270b5b797438a6fa987872db848017704ce34886))

### Features

- Add an optional upload button to the AppMap view
  ([#211](https://github.com/getappmap/appmap-js/issues/211))
  ([12263ce](https://github.com/getappmap/appmap-js/commit/12263ce0b2d4ffd7435c7d5799be2e298dd19008))
- Display labels as a tag cloud ([#194](https://github.com/getappmap/appmap-js/issues/194))
  ([6641237](https://github.com/getappmap/appmap-js/commit/6641237a21da6e9ee1d7a45ca028931dbb9d71ec))

# @appland/components-v1.0.0 (2021-05-11)

### Bug Fixes

- Add publish config
  ([118c54f](https://github.com/getappmap/appmap-js/commit/118c54f3db08f19de39bca7d67abd36a0071a20e))
- Flag package as public
  ([67e179c](https://github.com/getappmap/appmap-js/commit/67e179cd72ba247903764de25d8c86e0dd07bf9b))

### Features

- Initial release ([#195](https://github.com/getappmap/appmap-js/issues/195))
  ([c4776a0](https://github.com/getappmap/appmap-js/commit/c4776a0514c333746846b8ffca88465f8c2739ee))
