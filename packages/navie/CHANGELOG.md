# [@appland/navie-v1.44.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.44.0...@appland/navie-v1.44.1) (2025-04-14)


### Bug Fixes

* Handle copilot token limit exceeded errors in review command ([8444e8c](https://github.com/getappmap/appmap-js/commit/8444e8c32d6fedeb64357d7aad059160f9efe65f))

# [@appland/navie-v1.44.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.43.0...@appland/navie-v1.44.0) (2025-04-09)


### Features

* Add URI ([32039e8](https://github.com/getappmap/appmap-js/commit/32039e84e2668d9efd7520f9f7183b2809044d6e))
* Implement completion termination ([41e285c](https://github.com/getappmap/appmap-js/commit/41e285c0c56a56664340fe2db0a9fffb82206f57))

# [@appland/navie-v1.43.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.42.3...@appland/navie-v1.43.0) (2025-03-27)


### Features

* Allow a per-message model override ([7691f2d](https://github.com/getappmap/appmap-js/commit/7691f2db5312e74ae276bd3f6bc8f82bc24d79c8))

# [@appland/navie-v1.42.3](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.42.2...@appland/navie-v1.42.3) (2025-03-14)


### Bug Fixes

* Notify users of termination due to content restrictions ([#2262](https://github.com/getappmap/appmap-js/issues/2262)) ([535296c](https://github.com/getappmap/appmap-js/commit/535296c0dd75a5b22b865a44a03b8e8a85275332))

# [@appland/navie-v1.42.2](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.42.1...@appland/navie-v1.42.2) (2025-02-19)


### Bug Fixes

* Add a default prompt to `[@diagram](https://github.com/diagram)` ([6d43979](https://github.com/getappmap/appmap-js/commit/6d43979820fad31473d7b626da872efecaae4dca))
* Improve logging around edge cases ([e5b9e30](https://github.com/getappmap/appmap-js/commit/e5b9e30697b6b68ce295b7014c9f01d279caa4ab))
* Pinned items now presented as user context ([ec5df63](https://github.com/getappmap/appmap-js/commit/ec5df63fb65d4e92f67fef9f11843fa8e060c8b5))
* Plan is more likely to present useful file paths ([dd211bc](https://github.com/getappmap/appmap-js/commit/dd211bcd76da87296d4839cfcc58eec06a345dd1))
* Provide default prompt for plain [@plan](https://github.com/plan) ([c941942](https://github.com/getappmap/appmap-js/commit/c9419427e6f047f3374222b6ad7dbb9cb54cfcad))
* Strip non-xml fences on changesets ([053d350](https://github.com/getappmap/appmap-js/commit/053d350a761c45c2f89bb02c9f6836a01caea1f4)), closes [#2248](https://github.com/getappmap/appmap-js/issues/2248)

# [@appland/navie-v1.42.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.42.0...@appland/navie-v1.42.1) (2025-02-11)


### Bug Fixes

* Improve the local generation JSON parsing ([68ee9aa](https://github.com/getappmap/appmap-js/commit/68ee9aa8bf77f128b3c1df51c41a802c8f977bfc))
* Pinned items are included in vector terms generation ([7f2aba3](https://github.com/getappmap/appmap-js/commit/7f2aba355b87091f5535668dfd9461e7fcd3db12))
* Reword 'question' to 'inquiry' in vector terms system prompt ([ebbc1d9](https://github.com/getappmap/appmap-js/commit/ebbc1d9e772a8e35fcb121d17be02d1ccbf31502))

# [@appland/navie-v1.42.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.41.0...@appland/navie-v1.42.0) (2025-01-24)


### Features

* Add diff context to any question ([a0afcd9](https://github.com/getappmap/appmap-js/commit/a0afcd94b4de8a9ffe7ceb4fe95018894f517f80))
* Enable gatherer to request the project diff ([014d762](https://github.com/getappmap/appmap-js/commit/014d7622345b01dfc68310a1c8d2bede23eb3308))

# [@appland/navie-v1.41.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.40.0...@appland/navie-v1.41.0) (2025-01-23)


### Bug Fixes

* [@explain](https://github.com/explain) won't direct the user to provide help with AppMap or to make appmap data ([eff40ba](https://github.com/getappmap/appmap-js/commit/eff40baadc2c61f0373c4a2c308fb52e79198caf)), closes [#2195](https://github.com/getappmap/appmap-js/issues/2195)
* Include pinned files in the content considered by vector terms ([355d931](https://github.com/getappmap/appmap-js/commit/355d931458dded962a186de86722c451e75c530d)), closes [#2199](https://github.com/getappmap/appmap-js/issues/2199)


### Features

* [@help](https://github.com/help) uses a directory listing rather than tech stack analysis ([b83566e](https://github.com/getappmap/appmap-js/commit/b83566e89098dd68928d9a4ef28ce2bc91f21fd1))
* Display [@command](https://github.com/command) in next step suggestions ([ab1b0b6](https://github.com/getappmap/appmap-js/commit/ab1b0b6fc80a75d575592e488c738140ca871a9b)), closes [#2198](https://github.com/getappmap/appmap-js/issues/2198)

# [@appland/navie-v1.40.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.39.3...@appland/navie-v1.40.0) (2025-01-13)


### Bug Fixes

* /tokenlimit is not overriding the TOKEN_LIMIT env var ([e5ba762](https://github.com/getappmap/appmap-js/commit/e5ba762c63273f546ac13cec907264d34c8559d1))


### Features

* Disable the selection of help mode by default ([2489694](https://github.com/getappmap/appmap-js/commit/2489694031a69c13ab5a291d683856e79353a4e1))

# [@appland/navie-v1.39.3](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.39.2...@appland/navie-v1.39.3) (2025-01-02)


### Bug Fixes

* Only try once in classifier, ignore classifier errors ([e792acb](https://github.com/getappmap/appmap-js/commit/e792acbdad2a4a0878c9b7c7a8785140f105494c))

# [@appland/navie-v1.39.2](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.39.1...@appland/navie-v1.39.2) (2024-12-22)


### Bug Fixes

* Allow 'low' classification score ([7dc034e](https://github.com/getappmap/appmap-js/commit/7dc034eac69ea316a92c7fadc7aed1909c37f367))

# [@appland/navie-v1.39.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.39.0...@appland/navie-v1.39.1) (2024-12-20)


### Bug Fixes

* Fix a typo in `/gather` option ([9962675](https://github.com/getappmap/appmap-js/commit/9962675b0a5431b741388109456335f439634459))
* Log the error when json generation with anthropic fails ([61f817f](https://github.com/getappmap/appmap-js/commit/61f817f1233c16bd7ce4f4936fffb3400c31967a))
* More robust classification service ([8e421c2](https://github.com/getappmap/appmap-js/commit/8e421c20e49ce6c8cd4899c257940b69851bf889))

# [@appland/navie-v1.39.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.38.2...@appland/navie-v1.39.0) (2024-12-18)


### Bug Fixes

* Always set directory field on a context item event ([545e2fe](https://github.com/getappmap/appmap-js/commit/545e2fe258a5de152d9e4c1a13f241b566235424))
* Collect location context in the generate agent ([6c3d0b7](https://github.com/getappmap/appmap-js/commit/6c3d0b75ea6d556b89e60f6800fceb72efb912f0))
* Get rid of ./ when listing project root directories ([526b9c4](https://github.com/getappmap/appmap-js/commit/526b9c4d89e0b658210237cac301b61f43e17302))
* When Vertex AI errors out, don't print the entire error ([20b55bf](https://github.com/getappmap/appmap-js/commit/20b55bfacd464e25712135fe599526a936ccff6a))


### Features

* Allow gatherer to do full text search ([efcb903](https://github.com/getappmap/appmap-js/commit/efcb9036d1c0afd96132d821cf560c78441f0b7b))
* Allow looking up directory listings when collecting context ([b1f8441](https://github.com/getappmap/appmap-js/commit/b1f8441b07ae3619b2279bc4fe3c90e7afe4ee8d))
* Gather additional context from the project ([3fa028d](https://github.com/getappmap/appmap-js/commit/3fa028d1095ba9d98265a79d3aa5b9621439fcab))
* When asking for location context, ask for root directory listing ([5a1a7e1](https://github.com/getappmap/appmap-js/commit/5a1a7e193c498602e94513d0570f0e24c10c0b34))

# [@appland/navie-v1.38.2](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.38.1...@appland/navie-v1.38.2) (2024-12-18)


### Bug Fixes

* `[@welcome](https://github.com/welcome)` suggests improvements ([5d25ea3](https://github.com/getappmap/appmap-js/commit/5d25ea3e08ed82d1f1b3baa7631aacb542f78337))

# [@appland/navie-v1.38.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.38.0...@appland/navie-v1.38.1) (2024-12-17)


### Bug Fixes

* Review now includes code selections ([8ea7137](https://github.com/getappmap/appmap-js/commit/8ea713712a8d20f5211d0380e435bdbfd914df83))

# [@appland/navie-v1.38.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.37.0...@appland/navie-v1.38.0) (2024-12-11)


### Features

* Update the welcome command prompt ([6999935](https://github.com/getappmap/appmap-js/commit/6999935a210dba52b56b98a8f2f0a0ee3cf565ff))

# [@appland/navie-v1.37.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.36.2...@appland/navie-v1.37.0) (2024-12-06)


### Features

* Add `[@welcome](https://github.com/welcome)` command ([ad19ea2](https://github.com/getappmap/appmap-js/commit/ad19ea248e1c316707d03964f2d4611b97f2ed76))

# [@appland/navie-v1.36.2](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.36.1...@appland/navie-v1.36.2) (2024-11-26)


### Bug Fixes

* `[@review](https://github.com/review)` searches with vector terms ([1fdebed](https://github.com/getappmap/appmap-js/commit/1fdebede0771262c391a86aa7fc3824b06a18b0f))

# [@appland/navie-v1.36.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.36.0...@appland/navie-v1.36.1) (2024-11-26)


### Bug Fixes

* Retrieve pinned items via location context lookup ([7941082](https://github.com/getappmap/appmap-js/commit/7941082fd60b03ecb6ab19961a87ddf22a4cb369))

# [@appland/navie-v1.36.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.35.1...@appland/navie-v1.36.0) (2024-11-11)


### Features

* Add `[@review](https://github.com/review)` command ([3a6f741](https://github.com/getappmap/appmap-js/commit/3a6f7413dd9343b79067fbe7b1dd19322dbbc61f))

# [@appland/navie-v1.35.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.35.0...@appland/navie-v1.35.1) (2024-10-31)


### Bug Fixes

* Instruct the LLM to be briefer in the vector terms ([b2c310b](https://github.com/getappmap/appmap-js/commit/b2c310b567ca914fd9f894eeac33b15afcb69f3a))
* Retry JSON queries on Vertex AI ([cddad7c](https://github.com/getappmap/appmap-js/commit/cddad7c59a3d4cdf0b9f36721407a6817e237847))

# [@appland/navie-v1.35.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.34.5...@appland/navie-v1.35.0) (2024-10-30)


### Features

* [@search](https://github.com/search) command emits file: URLs ([1d3d85c](https://github.com/getappmap/appmap-js/commit/1d3d85c253bbf206c99f0983cff21867c28b3c51))

# [@appland/navie-v1.34.5](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.34.4...@appland/navie-v1.34.5) (2024-10-29)


### Bug Fixes

* Filter xml markdown fences around changes ([f41b7a1](https://github.com/getappmap/appmap-js/commit/f41b7a1c882b089d58752a2c973b04f1207633c2))

# [@appland/navie-v1.34.4](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.34.3...@appland/navie-v1.34.4) (2024-10-28)


### Bug Fixes

* Strip options from chat history given to the LLM ([7007a03](https://github.com/getappmap/appmap-js/commit/7007a03bbfa6c1ccd2646c024bbc0623d6552091))

# [@appland/navie-v1.34.3](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.34.2...@appland/navie-v1.34.3) (2024-10-25)


### Bug Fixes

* Don't retry when hitting copilot content filter while generating JSON ([ef29439](https://github.com/getappmap/appmap-js/commit/ef294392c8f4622bd75e9b7a889a148d95b1586d)), closes [#2089](https://github.com/getappmap/appmap-js/issues/2089)

# [@appland/navie-v1.34.2](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.34.1...@appland/navie-v1.34.2) (2024-10-23)


### Bug Fixes

* Make mermaid diagram fixing more robust ([dfc2eab](https://github.com/getappmap/appmap-js/commit/dfc2eabe2e5effb3486883f60205e85a15b4db55))

# [@appland/navie-v1.34.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.34.0...@appland/navie-v1.34.1) (2024-10-22)


### Bug Fixes

* Vector term service now tries to split compound words ([a831259](https://github.com/getappmap/appmap-js/commit/a831259dfa402e3bc32e2b9ca9ba9646d4b2d0bf))

# [@appland/navie-v1.34.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.33.1...@appland/navie-v1.34.0) (2024-10-22)


### Bug Fixes

* Prevent LLM from generating special characters in class names ([8347b53](https://github.com/getappmap/appmap-js/commit/8347b538137bf320f5dd20b2678f961788cfe8ec))
* Remove "Rendering diagram..." when rendering the diagram ([fc95b0e](https://github.com/getappmap/appmap-js/commit/fc95b0e7ee1d711e29331fd9ba1f3045f9f5c679))


### Features

* Support Gemini via Vertex AI ([fc4dabf](https://github.com/getappmap/appmap-js/commit/fc4dabf1f5de1a9ff3695f3397729a19fb299c95))

# [@appland/navie-v1.33.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.33.0...@appland/navie-v1.33.1) (2024-10-21)


### Bug Fixes

* ensure pinned file content is fresh ([dcdf7c1](https://github.com/getappmap/appmap-js/commit/dcdf7c109a139401441e7b705729299de9ee196e))

# [@appland/navie-v1.33.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.32.1...@appland/navie-v1.33.0) (2024-10-08)


### Features

* Add a single pass message compression strategy ([26768dd](https://github.com/getappmap/appmap-js/commit/26768dd08682daeeed0133085430665fe4e84c5a))

# [@appland/navie-v1.32.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.32.0...@appland/navie-v1.32.1) (2024-10-08)


### Bug Fixes

* The number of historical messages is now 4 by default, up from 2 ([bef49d8](https://github.com/getappmap/appmap-js/commit/bef49d802d4aaf690ab2369e535a9e00f3746c62))

# [@appland/navie-v1.32.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.31.1...@appland/navie-v1.32.0) (2024-10-02)


### Features

* Export Subscription types ([f2bc44b](https://github.com/getappmap/appmap-js/commit/f2bc44bec3b5f32e8075ec1d94e64d5b9ae39f83))

# [@appland/navie-v1.31.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.31.0...@appland/navie-v1.31.1) (2024-10-02)


### Bug Fixes

* Handle empty prompts gracefully ([f195e35](https://github.com/getappmap/appmap-js/commit/f195e35ca4a49bc6678195e462c78dddfdae9fae))

# [@appland/navie-v1.31.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.30.3...@appland/navie-v1.31.0) (2024-10-01)


### Bug Fixes

* Adjust generate prompt ([46228ab](https://github.com/getappmap/appmap-js/commit/46228ab44c95c10d631d79e4a47d7f99d189e90b))


### Features

* Generate diff output with [@test](https://github.com/test) command ([82578b8](https://github.com/getappmap/appmap-js/commit/82578b8f62ecbcd0a9910a4f32a6566744d8e85e)), closes [#1983](https://github.com/getappmap/appmap-js/issues/1983)

# [@appland/navie-v1.30.3](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.30.2...@appland/navie-v1.30.3) (2024-09-27)


### Bug Fixes

* Always suggest `[@generate](https://github.com/generate)` following `[@plan](https://github.com/plan)` ([e6d2dcc](https://github.com/getappmap/appmap-js/commit/e6d2dcc5f5ddfd86397d98b39a6f554573797ed0))

# [@appland/navie-v1.30.2](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.30.1...@appland/navie-v1.30.2) (2024-09-24)


### Bug Fixes

* Anthropic API URL is no longer hard coded ([da75da0](https://github.com/getappmap/appmap-js/commit/da75da0065a298f5da0ba89e2811d792479939d1))

# [@appland/navie-v1.30.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.30.0...@appland/navie-v1.30.1) (2024-09-23)


### Bug Fixes

* Truncate largest message if max tokens are exceeded ([e5ced70](https://github.com/getappmap/appmap-js/commit/e5ced703f8abe8987fb5a54fa11accbe386a82ed))

# [@appland/navie-v1.30.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.29.2...@appland/navie-v1.30.0) (2024-09-20)


### Bug Fixes

* Use mini model for vector terms and classification ([afe2a59](https://github.com/getappmap/appmap-js/commit/afe2a59bc5a657b3374b123333670b837d8c208e))


### Features

* Support O1 models ([e813a01](https://github.com/getappmap/appmap-js/commit/e813a01e9e0a37b62594818a2988a236c24be01a))

# [@appland/navie-v1.29.2](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.29.1...@appland/navie-v1.29.2) (2024-09-20)


### Bug Fixes

* Retry completion if OpenAI throws a server error while streaming ([c220ab5](https://github.com/getappmap/appmap-js/commit/c220ab54f1834c832b5a9d03d69cae0443129da2))

# [@appland/navie-v1.29.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.29.0...@appland/navie-v1.29.1) (2024-09-20)


### Bug Fixes

* Retry on Claude overload error ([b5395f1](https://github.com/getappmap/appmap-js/commit/b5395f1dc7ee201b0f710631c4e9328abafaf730))
* Update @langchain/anthropic to v0.3.1 ([9760d25](https://github.com/getappmap/appmap-js/commit/9760d25b599bf0c6c0657bd2f87163e7bce67ad8))

# [@appland/navie-v1.29.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.28.1...@appland/navie-v1.29.0) (2024-09-19)


### Bug Fixes

* Be even more directive about what FileChangeExtractor is supposed to do ([2551bab](https://github.com/getappmap/appmap-js/commit/2551babd084ec35192fe8897a3bea0cfa1fa4573))
* Fix typo in prompt ([1832d59](https://github.com/getappmap/appmap-js/commit/1832d595ac67aca463bc48c571254e81e061647d))
* Handle the case when fileNames is empty or undefined ([ae45fde](https://github.com/getappmap/appmap-js/commit/ae45fdedc95be306b9bf692080a6416522b8ed2a))
* Prompt for fences in mixed content ([a9298ea](https://github.com/getappmap/appmap-js/commit/a9298ea69a327ec3c96c0e50e44031941b7a908b))


### Features

* Add /classify switch ([ab73088](https://github.com/getappmap/appmap-js/commit/ab73088b5de199f45f23ae0af8163ce0974b185d))
* Navie emits sent / received events for all LLM interactions ([efc6f74](https://github.com/getappmap/appmap-js/commit/efc6f744d6537ac06c42b7715cbf84c5109610ce))

# [@appland/navie-v1.28.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.28.0...@appland/navie-v1.28.1) (2024-09-18)


### Bug Fixes

* More verbose errors from Anthropic completion service ([d66fdc9](https://github.com/getappmap/appmap-js/commit/d66fdc93654cb2d2c7ce36e91c9f78e52519fd25))

# [@appland/navie-v1.28.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.27.2...@appland/navie-v1.28.0) (2024-09-17)


### Features

* Add a [@observe](https://github.com/observe) command for recording suggestions ([f4bd42c](https://github.com/getappmap/appmap-js/commit/f4bd42cf5776c0c19da6fc674912adea601664b8))

# [@appland/navie-v1.27.2](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.27.1...@appland/navie-v1.27.2) (2024-09-16)


### Bug Fixes

* Ignore [@suggest](https://github.com/suggest) commands in chat history when building context ([ade8882](https://github.com/getappmap/appmap-js/commit/ade8882a1064259df9b1246f9243deb5176e3a78))

# [@appland/navie-v1.27.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.27.0...@appland/navie-v1.27.1) (2024-09-04)


### Bug Fixes

* Don't retry on 422 with OpenAI completion ([91d9711](https://github.com/getappmap/appmap-js/commit/91d9711a46bbae3d587d3f8909d21f67a4d4dd07))

# [@appland/navie-v1.27.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.26.1...@appland/navie-v1.27.0) (2024-09-03)


### Features

* Allow passing a <change>-set to apply CLI command ([9055d9a](https://github.com/getappmap/appmap-js/commit/9055d9a5a868032a93d7c948260ad091de5caf13))
* Show diff when generating and applying code changes ([d90a0c8](https://github.com/getappmap/appmap-js/commit/d90a0c8c12ade97de0f79d10967719d947d65267))

# [@appland/navie-v1.26.1](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.26.0...@appland/navie-v1.26.1) (2024-09-02)


### Bug Fixes

* Simplify the [@test](https://github.com/test) prompt ([f308c1e](https://github.com/getappmap/appmap-js/commit/f308c1e5bd16a6cad9fa4303df24615bf759aa9f))

# [@appland/navie-v1.26.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.25.0...@appland/navie-v1.26.0) (2024-08-30)


### Features

* Implement `[@suggest](https://github.com/suggest)` command ([fd3f6b2](https://github.com/getappmap/appmap-js/commit/fd3f6b216192f65c86c18eee6dcd5e4bf3068856))

# [@appland/navie-v1.25.0](https://github.com/getappmap/appmap-js/compare/@appland/navie-v1.24.0...@appland/navie-v1.25.0) (2024-08-23)


### Bug Fixes

* Make sure that sliced message history starts with a user message ([8e8b96f](https://github.com/getappmap/appmap-js/commit/8e8b96f87aa4baeef7fca56d032f2385799feafb))
* Provide a better prompt when using plain [@generate](https://github.com/generate) ([233ee79](https://github.com/getappmap/appmap-js/commit/233ee79241a763526251d6998160310e7748b28e))


### Features

* Support for Anthropic AI API ([5ba1694](https://github.com/getappmap/appmap-js/commit/5ba16947674f23cc72785ba0fd8dd51a6e4af815))

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
