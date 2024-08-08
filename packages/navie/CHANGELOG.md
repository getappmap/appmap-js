# [@appland/navie-v1.24.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.23.0...@appland/navie-v1.24.0) (2024-08-08)


### Bug Fixes

* Fix prompts ([2728e11](https://github.com/getappmap/appmap-js/commit/2728e11c219bfb9af04957e5ad7bbe3b6054de0b))
* Suppress parseJSON warning ([aaf6e6d](https://github.com/getappmap/appmap-js/commit/aaf6e6d1e4c919249177da609436a7adf7ab39d7))


### Features

* [@search](https://github.com/search) command ([6566b89](https://github.com/getappmap/appmap-js/commit/6566b898debb2fbb59db65a3656360d12991138f))
* /listfiles option to disable content fetching ([900b9ec](https://github.com/getappmap/appmap-js/commit/900b9ec3a2190f6b3a32fa3f3e79842bb57f8f92))
* /projectinfo option ([0b79611](https://github.com/getappmap/appmap-js/commit/0b79611305054c6bdd049a6d87c44a0bc6757eaf))
* Add cost info for gpt-4o-mini ([0f09d5b](https://github.com/getappmap/appmap-js/commit/0f09d5b77239392849f1a63186bfc74ff45427eb))
* Handle search term normalization on the backend ([93add59](https://github.com/getappmap/appmap-js/commit/93add598a9930af268a33ed19b9f68b2a93cc290))
* Prompt update ([a679712](https://github.com/getappmap/appmap-js/commit/a67971253313a864499675fd977b346bd9e67096))
* Prompt updates to make file detection more reliable ([1eabdcb](https://github.com/getappmap/appmap-js/commit/1eabdcb58fdc7783b7a77f2d52eae1c9dd0f5c16))

# [@appland/navie-v1.23.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.22.0...@appland/navie-v1.23.0) (2024-07-30)


### Features

* Fetch and apply named file content ([b86214e](https://github.com/getappmap/appmap-js/commit/b86214e6ea0060c1cba99cb529abd4f04c03b5b8))
* Lookup location context ([bfa2351](https://github.com/getappmap/appmap-js/commit/bfa2351fbaec1ed181fb0b785a5bfddfb6d84f16))
* Specify agent prompt and format in a consistent way ([ba4049c](https://github.com/getappmap/appmap-js/commit/ba4049c65767553ae833c333430786edfc684e48))
* Use temperature=0 for generating code ([f4e820c](https://github.com/getappmap/appmap-js/commit/f4e820cb0cd7a0913abdac9d4b75435d40a353e8))

# [@appland/navie-v1.22.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.21.0...@appland/navie-v1.22.0) (2024-07-30)


### Features

* Instruct the LLM how to reference files in code blocks ([da94520](https://github.com/getappmap/appmap-js/commit/da945204bf41958604caab2c866dec9de1e539aa))
* Navie cites context items with absolute paths ([90fe9d4](https://github.com/getappmap/appmap-js/commit/90fe9d4c24b46983bb051dc4d5609a8ee61945e3))

# [@appland/navie-v1.21.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.20.0...@appland/navie-v1.21.0) (2024-07-24)


### Bug Fixes

* Remove file-update-service and [@apply](https://github.com/apply) command ([b21dce7](https://github.com/getappmap/appmap-js/commit/b21dce74ee19e77cd7f00a063c31a07e72a893f5))
* Remove unused FilePatchService ([bcd1a87](https://github.com/getappmap/appmap-js/commit/bcd1a87b01115721bb705358746128e23df7e1ba))


### Features

* [@update](https://github.com/update) command ([3e791d6](https://github.com/getappmap/appmap-js/commit/3e791d686e956b5b12fa269338fff460a8c025d6))

# [@appland/navie-v1.20.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.19.0...@appland/navie-v1.20.0) (2024-07-19)


### Bug Fixes

* More robust location parsing ([7ae1dd2](https://github.com/getappmap/appmap-js/commit/7ae1dd2e18c21451c0c0da954c93a3e73286b5eb))
* Remove unused file mermaid-fixer.ts ([c2f6920](https://github.com/getappmap/appmap-js/commit/c2f69209f7230f6b2cdf12293203ce13b71e705b))


### Features

* Add prompting for special characters in flowcharts ([fd4192f](https://github.com/getappmap/appmap-js/commit/fd4192fdd1a16b7b64186ca79cbdc586e7ae6c07))

# [@appland/navie-v1.19.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.18.0...@appland/navie-v1.19.0) (2024-07-17)


### Bug Fixes

* Update prompt for [@plan](https://github.com/plan) agent ([3c9d259](https://github.com/getappmap/appmap-js/commit/3c9d259d370be381d69cd78a67db3f3cc98da09c))


### Features

* [@diagram](https://github.com/diagram) mode ([a569f7e](https://github.com/getappmap/appmap-js/commit/a569f7eb43da3d4cc17dd9717164be23fa3354c2))
* Improve classification of the latest question ([978bd7d](https://github.com/getappmap/appmap-js/commit/978bd7dcf2dad3d2b9bcced037fed6cad7ecbadd))

# [@appland/navie-v1.18.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.17.0...@appland/navie-v1.18.0) (2024-07-16)


### Bug Fixes

* [@help](https://github.com/help) mode considers configured languages ([bea7ca5](https://github.com/getappmap/appmap-js/commit/bea7ca5bee9b22a69eb0c19eb22ffd779d4fa1d4))
* Tune up [@explain](https://github.com/explain) agent output ([10d131b](https://github.com/getappmap/appmap-js/commit/10d131b1b91aad5b33b4dfebf4b8427d4763b326))


### Features

* [@help](https://github.com/help) mode has built-in knowledge of Navie modes ([9796399](https://github.com/getappmap/appmap-js/commit/979639943b69b23bede1d84851d5f5ca92eb0b01))
* /nohelp disables help mode ([ecfc3ea](https://github.com/getappmap/appmap-js/commit/ecfc3ea343671f7879a3f27feb159833f97c13ca))
* Tell the user when an agent mode is auto-selected ([42ba342](https://github.com/getappmap/appmap-js/commit/42ba34275c600e701b4ebc9976004de2eb5e5a8f))

# [@appland/navie-v1.17.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.16.1...@appland/navie-v1.17.0) (2024-07-09)


### Bug Fixes

* Normalize context representations ([088ba5d](https://github.com/getappmap/appmap-js/commit/088ba5d55ace28a5a5d4c9caec42cda5270cd1bd))


### Features

* Include N previous chat messages during explain ([5f9ac70](https://github.com/getappmap/appmap-js/commit/5f9ac70e28863531a1221c23527c7b02eb2e267f))

# [@appland/navie-v1.16.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.16.0...@appland/navie-v1.16.1) (2024-06-27)


### Bug Fixes

* Merge all system messages ([2abd671](https://github.com/getappmap/appmap-js/commit/2abd671a1eaa8fa2443e147a37eee67dd8fa89b2)), closes [#1860](https://github.com/getappmap/appmap-js/issues/1860)
* Use correct 'assistant' role in vector terms examples ([fab4393](https://github.com/getappmap/appmap-js/commit/fab43938b4e6b32a7f0aaa58c6ff567e009dfd71))

# [@appland/navie-v1.16.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.15.0...@appland/navie-v1.16.0) (2024-06-26)


### Features

* Filter by file path and context item type ([282ed20](https://github.com/getappmap/appmap-js/commit/282ed2087358900fc41b2ac61d379c03464fa728))

# [@appland/navie-v1.15.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.14.0...@appland/navie-v1.15.0) (2024-06-18)


### Bug Fixes

* Tolerate mismatch in number of blank lines when applying update ([230d14f](https://github.com/getappmap/appmap-js/commit/230d14fcc83cffb620e3a2f543f5885204df68e6)), closes [#1841](https://github.com/getappmap/appmap-js/issues/1841)
* Tolerate mismatch in number of blank lines when applying update ([ee6a4c8](https://github.com/getappmap/appmap-js/commit/ee6a4c8f2bd3ac7e24a27b251f4c34c6de1c522f)), closes [#1841](https://github.com/getappmap/appmap-js/issues/1841)
* When applying updates, make sure to retry the same line on mismatch ([b12fb0a](https://github.com/getappmap/appmap-js/commit/b12fb0a32851901f1217093b4986490f958be936))
* When applying updates, make sure to retry the same line on mismatch ([ad56df3](https://github.com/getappmap/appmap-js/commit/ad56df39e06b40b7a3a48884c5e4f5e37f2122cc))


### Features

* --prompt and /noterms options ([9802fdc](https://github.com/getappmap/appmap-js/commit/9802fdc9baded47ccc565ed6f4fb79850f1d3ad6))
* Exclude context by file pattern ([0ad604a](https://github.com/getappmap/appmap-js/commit/0ad604a99ac745326facefaf0ad4c2990a9ae813))

# [@appland/navie-v1.14.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.13.0...@appland/navie-v1.14.0) (2024-06-11)


### Bug Fixes

* Apply changes in a more robust way ([00bcb78](https://github.com/getappmap/appmap-js/commit/00bcb78ac5675ec13c91698e6082c8fb68ebd3de))
* Direct output from the apply step to apply.md ([57df591](https://github.com/getappmap/appmap-js/commit/57df591191fa0b4d7186a25552bacad0eb9725e7))
* Fixes to parseOptions ([7787ac8](https://github.com/getappmap/appmap-js/commit/7787ac8c09b4a605e63542d0f5a797ec1dac1fc7))
* Ignore leading spaces when parsing options ([be4ff55](https://github.com/getappmap/appmap-js/commit/be4ff5507918e3a8590a08ba69dfef1a76f5fdff))
* Let changeextractor accept different tag capitalization ([b4458c7](https://github.com/getappmap/appmap-js/commit/b4458c7d20bf606cb218e3abdae84e72cd640b10))
* Trim leading and trailing whitespace in the modifications correctly ([c4e43fe](https://github.com/getappmap/appmap-js/commit/c4e43fe2824fabcd285e1f97eed7edfef9403978))
* Tune the change parsing ([45f704b](https://github.com/getappmap/appmap-js/commit/45f704b9d4add57c6d9a8ba785aab4ee033d96ea))


### Features

* [@apply](https://github.com/apply) all described code changes ([499da29](https://github.com/getappmap/appmap-js/commit/499da296789a8a680014c73530bfd1ff0f1eee60))
* [@apply](https://github.com/apply) and [@test](https://github.com/test) commands ([c4fcaea](https://github.com/getappmap/appmap-js/commit/c4fcaeacea6c9b1748ad20050af607024722d20c))
* [@context](https://github.com/context) can dump as yaml or json ([c43c774](https://github.com/getappmap/appmap-js/commit/c43c774ea0827b50ef896a8bf8a5b8a644c11db9))
* [@context](https://github.com/context) command ([1509709](https://github.com/getappmap/appmap-js/commit/1509709fda99c18f2a143997531e4d65f2c2dc54))
* /nocontent option ([303a4c5](https://github.com/getappmap/appmap-js/commit/303a4c5f0619d8adc4d9c7792c99eb519f73be0d))
* Add [@list-files](https://github.com/list-files) command ([ccebba2](https://github.com/getappmap/appmap-js/commit/ccebba2ebc4b830ff60c6951d807980975dd3ebd))
* Add [@plan](https://github.com/plan) agent ([2d3985e](https://github.com/getappmap/appmap-js/commit/2d3985e06e80dc3a4e9356282b9ae270277f29a8))
* Add bin/solve script ([ef9d52c](https://github.com/getappmap/appmap-js/commit/ef9d52c31fc1ce0279c24c7cfa5db28676d4b02a))
* Detect [@command](https://github.com/command) on the first line by itself ([83a4fed](https://github.com/getappmap/appmap-js/commit/83a4fed2578131cc27bd1f88db7892c7417f4ba5))
* Handle missing and unformatted files ([e1dc846](https://github.com/getappmap/appmap-js/commit/e1dc84646f6b4399d529888b62d68e6ed90e14dd))
* Improve [@list-files](https://github.com/list-files) accuracy ([a337cc4](https://github.com/getappmap/appmap-js/commit/a337cc49042fc253cce48a07025e77738da49b28))
* Improve [@plan](https://github.com/plan) prompt ([cf889f1](https://github.com/getappmap/appmap-js/commit/cf889f131335e55a7d1f2e579132c5a51bea1c30))
* Make [@apply](https://github.com/apply) more effective ([22fdd3e](https://github.com/getappmap/appmap-js/commit/22fdd3eb1304def6d063ea03f9e560d83b3f470b))
* Offer /nocontext ([a3b7090](https://github.com/getappmap/appmap-js/commit/a3b7090c30e5fda1c559a510d518b80e100ce45f))
* Parse /slash options ([fcbae55](https://github.com/getappmap/appmap-js/commit/fcbae550914218b683f866ecd7089b800317ec9e))
* Parse out the changes using <original> and <modified> syntax ([8b0bc46](https://github.com/getappmap/appmap-js/commit/8b0bc46ef38f79db50bcd66604d2e3c41b059f50))
* Show cost estimates when calling the LLM ([d4a4c26](https://github.com/getappmap/appmap-js/commit/d4a4c262486981499cc1884f9fbec332dd747d9f))
* Tighten up the expectations for [@plan](https://github.com/plan) ([2a4dd6c](https://github.com/getappmap/appmap-js/commit/2a4dd6c86a5db7566d6cd9b6fe62803d92d05040))
* Use more straight file manipulation to apply changes ([2b0d624](https://github.com/getappmap/appmap-js/commit/2b0d62458f3f67f76e0d1e1f9862a279d670416a))
* Use XML format for file change proposals ([ccbce23](https://github.com/getappmap/appmap-js/commit/ccbce231b7ac2802d860259214862a884e91d819))

# [@appland/navie-v1.13.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.12.0...@appland/navie-v1.13.0) (2024-05-22)


### Features

* Agent can specify response text and temperature ([20c0434](https://github.com/getappmap/appmap-js/commit/20c043432c32460b6dd6a4f990c84fb73b828571))
* Move help-related content to the Help agent exclusively ([2274b8c](https://github.com/getappmap/appmap-js/commit/2274b8c14a348e0271e1159d9baa7e1c909d7c0b))

# [@appland/navie-v1.12.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.11.1...@appland/navie-v1.12.0) (2024-05-21)


### Features

* Emit agent and classification events ([dde41f1](https://github.com/getappmap/appmap-js/commit/dde41f1c237f726df0374f4d6841788e708b07d1))

# [@appland/navie-v1.11.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.11.0...@appland/navie-v1.11.1) (2024-05-20)


### Bug Fixes

* Provide vector term examples as chat primitives ([b6ff24d](https://github.com/getappmap/appmap-js/commit/b6ff24d93e6fe4567124f18a5171abf1ed5e273c))

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
