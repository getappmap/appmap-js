# AppMap Scanner

Code scanning, linting, assertions and alerts.

Provides consistent ways to filter (include and exclude) the AppMap events and property values.

## Event filters

Two standard event filters are provided that can be used with every rule: `include` and `exclude`.
These filters are applied to an event, and make a determination about whether or not that event
should be checked by the rule.

An event filter can be applied in one of two ways:

- `scope` the entire scope - for example, `http_server_request`, `command`.
- `event` an individual event within a scope. When `enumerateScope` is true for a rule, the event
  filters are applied automatically by the scanner framework. When `enumerateScope` is false, the
  rule code must apply the filter itself.

The event filter consists of a property name and a test. The framework fetches the property value
from the event, and then applies the test. The test can be one of three types:

- `equal` - value string matches the filter condition exactly.
- `include` - value string includes the filter condition.
- `match` - value string matches the filter condition regexp.

Here's an example of a rule configured with a custom `include` event filter. The event filter
prevents the rule from being applied to SQL queries that include the fragment
`FROM "pg_class" INNER JOIN "pg_attribute"` (because these queries are fetching ORM metadata, not
application code).

```yaml
- id: tooManyJoins
  exclude:
    - event:
        property: query
        test:
          include: FROM "pg_class" INNER JOIN "pg_attribute"
```

## Pattern filters

A second type of filter is pattern filter. Pattern filters are provided by rules that need, or
benefit from, specific configuration.

Like Event filters, a pattern filter uses `equal`, `include`, or `match`. The data to which the
pattern filter is applied depends on the particulars of the rule. For example, this pattern filter
finds slow function calls within a specific package:

```yaml
- id: slowFunctionCall
  properties:
    functions:
      - match: ^app/models
    timeAllowed: 0.25
```

## Schema validation

The configuration YAML is validated against the rule schema before the scan is run. Any errors in
the configuration are reported, and must be fixed before the scan can continue. Consult the
documentation for each rule to see it's pattern filters and other configurable properties.

## Finding hash

To enable de-duplication of findings, a hash is calculated for each finding. The hash is the
`sha256` digest of a canonical content string for the finding. The canonical content string combines
stable data from the finding, such as the rule id, normalized event, etc. See
[appmap-js/packages/models/src/event/hash.js](https://github.com/applandinc/appmap-js/blob/959a8c93c9be37d40a8f4a0e7d44ee211730641e/packages/models/src/event/hash.js)
for details.

## Findings output file

### `summary`

Summarizes key information about the scan, including: number of AppMaps scanned, number of checks
performed, list of rules utilized, list of labels utilized, number of findings, and an enumeration
of all the distinct values in AppMap metadata.

_Example_

```json
"summary": {
  "numAppMaps": 507,
  "numChecks": 8112,
  "rules": [
    "authz-before-authn",
    ...
    "update-in-get-request"
  ],
  "ruleLabels": [
    "audit",
    ...
    "security.logout"
  ],
  "numFindings": 91,
  "appMapMetadata": {
    "labels": [],
    "apps": [
      "appland/appmap-server"
    ],
    "clients": [
      {
        "name": "appmap",
        "url": "https://github.com/applandinc/appmap-ruby",
        "version": "0.70.2"
      }
    ],
    "frameworks": [
      {
        "name": "rails",
        "version": "6.1.4.1"
      },
      {
        "name": "rspec",
        "version": "3.10.1"
      }
    ],
    "git": [
      {
        "repository": "git@github.com:applandinc/appmap-server.git",
        "branch": "master",
        "commit": "3b028018ec1f84e2c351d01d1dac45aeeae887b6"
      },
      {
        "repository": "git@github.com:applandinc/appmap-server.git",
        "branch": "master",
        "commit": "3b028018ec1f84e2c351d01d1dac45aeeae887b6",
        "status": [
          "D .npmrc",
          "M appmap.yml",
          "M package-lock.json",
          "M package.json"
        ]
      }
    ],
    "languages": [
      {
        "name": "ruby",
        "engine": "ruby",
        "version": "3.0.1"
      }
    ],
    "recorders": [
      {
        "name": "rspec"
      }
    ],
    "testStatuses": [],
    "exceptions": []
  }
}
```

### `configuration`

Provides the configuration file, as JSON, that was used to configure the scanner.

_Example_

```json
"configuration": {
  "checks": [
    {
      "rule": "authzBeforeAuthn"
    },
    {
      "rule": "circularDependency",
      "properties": {
        "ignoredPackages": [
          {
            "equal": "app/models/concerns"
          },
          {
            "equal": "app/controllers/concerns"
          }
        ]
      }
    },
    {
      "rule": "http500"
    }
  ]
}
```

### `appMapMetadata`

Contains the metadata for each AppMap that was scanned. `appMapMetadata` is a JSON object, whose
keys are AppMap file names, and values are AppMap metadata objects. Each metadata object contains
all the metadata values, _except_ for those values which are the same across all AppMaps. Those
values can be found in `summary.appMapMetadata`. For example, using the `summary` example given
above, the `app`, `labels`, `languages`, `recorders`, `testStatuses` and `exceptions` will all be
omitted from `appMapMetadata`.

_Example_

```json
"appMapMetadata": {
  "tmp/appmap/rspec/API_APIKeysController_create_a_new_api_key.appmap.json": {
    "client": {
      "name": "appmap",
      "url": "https://github.com/applandinc/appmap-ruby",
      "version": "0.70.1"
    },
    "git": {
      "repository": "git@github.com:applandinc/appmap-server.git",
      "branch": "master",
      "commit": "3b028018ec1f84e2c351d01d1dac45aeeae887b6"
    },
    "name": "API::APIKeysController create a new api key",
    "source_location": "spec/requests/api_api_keys_spec.rb",
    "test_status": "succeeded",
    ...
  }
}
```

### `checks`

Lists the configured checks that were performed on each AppMap. Each entry is a Check object that
includes the properties of the check as configured by the `configuration`.

_Example_

```json
"checks": [
  {
    "rule": {
      "id": "authz-before-authn",
      "title": "Authorization performed before authentication",
      "labels": [
        "security.authorization",
        "security.authentication"
      ],
      "scope": "http_server_request",
      "impactDomain": "Security",
      "enumerateScope": false,
      "references": {
        "CWE-863": "https://cwe.mitre.org/data/definitions/863.html"
      },
      "description": "Determines when authorization logic is applied to a user identity that has not been properly verified. Because the the user's identity has not been verified yet, the outcome of the authorization check cannot be trusted. A malicious user might be able to get themselves authorized as a different user than they really are - or they may not be logged in at all.",
      "url": "https://appland.com/docs/analysis/rules-reference.html#authz-before-authn"
    },
    "id": "authz-before-authn",
    "options": {},
    "scope": "http_server_request",
    "includeScope": [],
    "excludeScope": [],
    "includeEvent": [],
    "excludeEvent": []
  },
  {
    "rule": {
      "id": "circular-dependency",
      "title": "Circular package dependency",
      "scope": "command",
      "impactDomain": "Maintainability",
      "references": {
        "CWE-1047": "https://cwe.mitre.org/data/definitions/1047.html"
      },
      "enumerateScope": false,
      "description": "Finds cycles in the package dependency graph. Cyclic dependencies make code hard to maintain because all the code in the cycle is inter-dependent. While it might look like the code in the different packages has separate functions, in essence all the code in the cycle acts like one big package.",
      "url": "https://appland.com/docs/analysis/rules-reference.html#circular-dependency"
    }
  }
]
```

### `findings`

Lists the findings that are reported by this scan. Findings are de-duplicated by comparing their
`hash` values. Therefore, each unique finding hash is only reported once.

Note that the `appMapFile` of each finding will be available in the `appMapMetadata` section of the
findings JSON document. Similarly, details of the `checkId` can be obtained from the `checks`
section.

_Example_

```json
"findings": [
    {
      "appMapFile": "./tmp/appmap/rspec/Extensions_Upload_processing_logged_in_appmap_with_org_name_with_org_membership_is_added_to_the_specified_org.appmap.json",
      "checkId": "illegal-package-dependency",
      "ruleId": "illegal-package-dependency",
      "ruleTitle": "Illegal use of code by a non-whitelisted package",
      "event": {
        "id": 244,
        "event": "call",
        "thread_id": 461760,
        "defined_class": "DAO::Scenario",
        "method_id": "validate",
        "path": "app/models/dao/scenario.rb",
        "lineno": 149,
        "static": false,
        "receiver": {
          "class": "DAO::Scenario",
          "object_id": 501420,
          "value": "#<DAO::Scenario:0x00007f7f50cd6a78>"
        }
      },
      "hash": "a3a2be87f722fe53e9fbbb57dd1acd82d8cf76d3c346556e8e495cd0a91eba2e",
      "stack": [
        "app/models/dao/scenario.rb:149",
        "app/controllers/concerns/mute_logging.rb:4",
        "app/models/scenario/save_scenario.rb:11",
        "app/models/scenario/build.rb:68",
        "app/controllers/scenario_uploads_controller.rb:60",
        "app/controllers/scenario_uploads_controller.rb:44",
        "app/controllers/concerns/with_authentication.rb:6",
        "app/controllers/concerns/in_transaction.rb:8"
      ],
      "scope": {
        "id": 11,
        "event": "call",
        "thread_id": 461760,
        "http_server_request": {
          "request_method": "GET",
          "path_info": "/scenario_uploads/1",
          "normalized_path_info": "/scenario_uploads/{id}",
          "headers": {
            "Host": "127.0.0.1:61019",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/97.0.4692.99 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-User": "?1",
            "Sec-Fetch-Dest": "document",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US",
            "Cookie": "appland_session=YKhMDBpgpV0hwKaBkxlaq%2BVzBRK2u6r%2BU%2BnFmJ61y5Q6TxptqxED597yhcmKqSTLfs%2FExRKU8WJ8iN7pV5Si7i0iJfPMa32ubjqMx0wVtcZ%2Fxo%2BwIcDF%2FI6Qaf7cU6oj6DaErr8GElQTTlA0TdRBrCgo43no%2BD4pSwkXvweqR175ZrCN%2FrjBZElvLaxyoY8kKsABEEtmI2aRcCcDJylP1hVrAI6%2BcWgVhb42ITJ8%2BuN0KiZDZSJWOsQFW6l656tyDDjC3UQvf65u5zvDAbqhIJkSEBXfn8p7c7I%2Bo8Cc9UWjLCNTCV%2BTL5iJ5qKDLHb7sHQftnOymCkyc%2FM57Bute59Lmyk6ZsNj4Y3Zbv6upszqyfJMhPyvcESz6BZCrzEGJudCueDtwNAnBPu3zE%2B1xQcKMpmF1R8Jw7ds41i90fFE0tkUCaiDzHdZUveVQKm7N%2F9pgTKE7a%2FyrevoPBKjpsqOrG%2BLe1Xhc%2FyWZBzXKbaTkHIRhoLijV9vGRH%2F%2Fk%2B9uZW0uhyfnoLDJB7af2vArKwNhEwuCBsXybPmyDDq2oLq8fMyWeVOpY7H44pGHho1D1qQdVfBzrLVoUG%2FqAbBSh0roHl%2FFjfRKmSil6iTQWQSNkemb73NNAsg3U2lI2AcjoNCzZHJS8S7iIpbZonabSR7AKyssx%2BSRYjdTsy5FplO--DN1nLB2Gux0u9W7x--RCmfYC53sopFkHidZ1uSNA%3D%3D",
            "Version": "HTTP/1.1"
          }
        }
      },
      "message": "Code object app/models/dao/DAO::Scenario#validate was invoked from app/controllers/concerns, not from ^app/models/?"
    }
]
```

## Development

We use `yarn` for package management. Run `yarn` to install dependencies and `yarn build` to emit
JavaScript. To run without first emitting JavaScript to the filesystem, use `yarn start`.

## Installation

Install like any other Node.js package, using `yarn` or `npm`:

```bash
yarn add --dev @appland/scanner
```

Then, you may find it convenient to add some scripts to your `package.json`:

```
  "scripts": {
    "scan": "npx @appland/scanner scan --appmap-dir tmp/appmap",
    "scan-ci": "npx @appland/scanner ci --appmap-dir tmp/appmap",
  },
```

**Note** `tmp/appmap` is the standard AppMap location for some AppMap agents, but not all. Consult
your agent documentation and settings to configure the `--appmap-dir`.

## Scan locally

```bash
yarn run scan
```

Findings will be printed to the console, and saved to `appland-findings.json`.

## CI integration

When using Appmap Scanner in CI you can post findings summary as a commit status and/or a PR comment
(currently only GitHub is supported). In order to allow access to your repo you need to create a
[personal token](https://github.com/settings/tokens/new) with following privileges and add it as a
`GH_TOKEN` env variable to your CI:

- `repo` for posting PR comments
- `repo:status` for posting commit statuses

```bash
yarn run scan-ci
```

When uploading findings to [app.land](https://app.land), branch and commit information will be
resolved from the environment if possible. If we do not yet support your CI provider or you have a
non-standard configuration, you may provide your own overrides by setting `APPMAP_BRANCH` and
`APPMAP_COMMIT`. Note that this is only necessary when Git is in a detached HEAD state.

## Development

### Using a local branch of `@appland/models`

Use `yarn link` to create a symlink to a local version of `@appland/models`. Make sure the models
package is built according to the instructions in its own README.

```sh
$ yarn link ../appmap-js/packages/models
```
