---
layout: docs
title: Docs - Reference
description: "Explore the AppMap CLI reference guide for analyzing runtime code behavior."
toc: true
reference: true
step: 10
name: Command line interface (CLI)
redirect_from: [docs/reference/appmap-swagger-ruby]
---

# Command line interface (CLI)

- [Command line interface (CLI)](#command-line-interface-cli)
  - [Overview](#overview)
  - [Prerequisites](#prerequisites)
    - [Install AppMap CLI Precompiled Binary](#install-appmap-cli-precompiled-binary)
  - [Usage](#usage)
  - [`install`](#install)
  - [`inspect`](#inspect)
  - [`sequence-diagram`](#sequence-diagram)
  - [`sequence-diagram-diff`](#sequence-diagram-diff)
  - [`openapi`](#openapi)
  - [`stats`](#stats)
  - [`prune`](#prune)
  - [`archive`](#archive)
  - [`restore`](#restore)
  - [`compare`](#compare)
  - [`compare-report`](#compare-report)
  - [GitHub repository](#github-repository)

## Overview

The AppMap CLI provides utility commands to install AppMap client libraries and work with AppMap Data.

## Prerequisites

### Install AppMap CLI Precompiled Binary

AppMap publishes binaries of the command-line installer for various operating systems, you can find the most recent version of the [AppMap command-line installer on GitHub](https://github.com/getappmap/appmap-js/releases?q=%40appland%2Fappmap*&expanded=true). Expand the "Assets" section to find binaries for Windows, Mac, and Linux.

Save this file locally and rename it to `appmap` (or `appmap.exe` for Windows). If you intend to access it from the command-line, ensure that you place the binary somewhere on your `PATH`.

The AppMap binary is all that is necessary to run the AppMap CLI (or `appmap.exe` for Windows). 

## Usage

Run the precompiled binary on the command line.

```console
$ appmap --help
```
{: .example-code}

## `install`

Open a terminal window in the top level folder of your project and run this command:

```console
$ appmap install
```
{: .example-code}

You will be guided through a series of steps for installing and configuring AppMap. Additionally, you'll have an option to auto-commit the library and configuration file to your repo, so that the rest of your team can use AppMap without having to repeat the setup process.

```
Installing AppMap agent for ....
? AppMap is about to be installed. Confirm the details below.
  Project type: Bundler
  Project directory: /Users/username/repos/sample_rails_app
  Git remote: origin	git@github.com:land-of-apps/sample_rails_app.git (fetch)
  Ruby version: 3.1.2p20
  Gem home: /Users/username/.asdf/installs/ruby/3.1.2/lib/ruby/gems/3.1.0

? AppMap is about to be installed. Confirm the details below.
? Commit these files to your repo so that everyone on your team can use AppMap
  without them having to repeat the setup process. Bring runtime code analysis
  to your whole team!
  Gemfile
  Gemfile.lock
  appmap.yml

  Commit? Yes
✔ Validating the AppMap agent...

   ╭─────────────────────────────────────────────────────────────────────╮
   │                                                                     │
   │              Success! AppMap has finished installing.               │
   │                                                                     │
   │                      NEXT STEP: Record AppMap Data                  │
   │                                                                     │
   │   You can consult the AppMap documentation, or continue with the    │
   │     instructions provided in the AppMap code editor extension.      │
   │                                                                     │
   ╰─────────────────────────────────────────────────────────────────────╯
```

The installer changes your project's build process (yarn.lock for
JavaScript, Gemfile for Ruby, etc) to run AppMap when the tests run
and when developing locally. It will not be added to your production system.

## `inspect` 

Search AppMap Data for references to a code object (package, function, class, query, route, etc) and print available event info.

```console
$ appmap inspect --help
```
{: .example-code}

```
  appmap inspect <code-object>

  Positionals:

    code-object  identifies the code-object to inspect                  [required]

  Options:
        --version      Show version number                               [boolean]
    -v, --verbose      Run with verbose logging                          [boolean]
        --help         Show help                                         [boolean]
        --appmap-dir   directory to recursively inspect for AppMap Data
                                                          [default: "tmp/appmap"]
    -i, --interactive  interact with the output via CLI                  [boolean]
```

You can use this command to search and display events and associated data from across all the AppMap Data in a directory (recursively explored). 

The `code-object` argument is a required argument, composed of a type and identifier. The inspect command will find all events that match this code object across the AppMap Data. Whether an event matches the `code-object` argument is defined as follows:

| code-object type | match criteria |
| -----------------|----------------|
| function | The event is a call to the specified function |
| class | The event is a call to any function on the specified class |
| package |The event is a call to any function on any class in the specified package |
| database | The event is a SQL query |
| table | The event is a SQL query which includes the specified table |
| query | The event is a SQL query which, when normalized, matches the specified query |
| route | The event is an HTTP server request which matches the specified route method and normalized path. |

Examples of supported search syntax:

* `function:my/package/My::Class#instance_method`
* `function:my/package/My::Class.static_method`
* `class:my/package/My::Class`
* `package:my/package`
* `table:table_name`
* `database:`
* `route:REQUEST_METHOD /route/:id` (HTTP request method followed by normalized path)
* `query:SELECT * FROM tables WHERE some_column = ?` (normalized SQL)

### Interactive mode

With the `--interactive` option, the results are presented in table form, and you can refine and drill into the data using the command line.

```console
$ appmap inspect --interactive
```
{: .example-code}

Without the `--interactive` option, all matching results are printed as JSON. This mode is suitable for searching AppMap Data and printing results that can be piped into other scripts (e.g. using [jq](https://stedolan.github.io/jq/)) for further processing.

**Interactive mode arguments** 

#### (h)ome

The home screen is displayed at the beginning of interactive mode. The `(h)ome` command will generally return you to the home screen, when you are in other parts of the app.

The home screen presents the following data:

| Field index | Field name | Description |
|-------------|------------|-------------|
| 1 | Events | A list of AppMap Diagrams and event indices that match the initial search term and filters. |
| 2 | Return values | Enumeration of all the different values returned by the matching object (most applicable when searching for a function). |
| 3 | HTTP server requests | Distinct routes in which the code object is found. Each listed result is a unique request method, normalized path, and status code. |
| 4 | SQL queries | Unique normalized SQL which is a descendant (or self) of the matching code object. |
| 5 | SQL tables | Unique tables which are found in the SQL queries, as defined in field 4. |
| 6 | Callers | Unique functions which are the parent of each matching code object. |
| 7 | Ancestors | Unique HTTP server requests and labeled functions which appear as an ancestor of a matching code object. |
| 8 | Descendants | Unique labeled functions which appear as a descendant of a matching code object. |
| 9 | Package trigrams | Unique combinations of caller → code-object → callee, converted to package names. |
| 10 | Class trigrams | Unique combinations of caller → code-object → callee, converted to class names. |
| 11 | Function trigrams | Unique combinations of caller → code-object → callee, as functions, SQL, or HTTP client requests. |

On the home screen, a field is displayed if there are only a small number of distinct values. Otherwise, the number of distinct values is shown, and you can use the `(p)rint` command to see the full details.

#### (p)rint

Prints the full details of a numbered field. Unlike the `(h)ome` view, which will summarize fields with many values, the `(p)rint` command will always print out all the distinct values of a field (even if there are thousands of them…).

#### (f)ilter

Applies a filter to the result set. You can use this command to reduce the number of search matches that are displayed, both on the `(h)ome` screen and in the `(p)rint` views.

When you choose the `(f)ilter` command, you’re first prompted to select which field you want to choose the filter value from. For example, you may see a table that includes `(2) Return values (3) HTTP server requests (6) Callers`. On choosing one of these fields, you are then prompted to select a value. The values will be the same as if you chose to `(p)rint` the selected field. Each field value is numbered; enter the number of the field value to activate it as a filter. 

The result set is then recomputed, matching only events that match BOTH the main code-object argument that you initially provided to the search command, AND the filter. 

For example, if you searched for `table:users` and then filtered by `request:GET /user 200`, the search would match every query that accesses the users table within an HTTP `GET` request to `/user` that returns status code `200`.

If you apply another filter, then BOTH filter conditions must match each result.

#### (u)ndo filter

Un-apply the most recently applied filter.

#### (r)eset filters

Remove all filters.

#### (q)uit

Quit the interactive program.

## `sequence-diagram`

```
appmap sequence-diagram <appmap...>

Generate a sequence diagram for an AppMap

Positionals:
  appmap                                        [array] [required] [default: []]

Options:
      --version       Show version number                              [boolean]
  -v, --verbose       Run with verbose logging                         [boolean]
      --help          Show help                                        [boolean]
  -d, --directory     program working directory                         [string]
      --output-dir    directory in which to save the sequence diagrams
      --show-browser  when using a browser to render the diagram, show the
                      browser window                  [boolean] [default: false]
      --loops         identify loops and collect under a Loop object
                                                       [boolean] [default: true]
  -f, --format        output format
                           [choices: "png", "plantuml", "json"] [default: "png"]
      --filter        Filter to use to prune the map                    [string]
      --exclude       code objects to exclude from the diagram      [deprecated]
      --expand        code objects to expand in the diagram
```

For example, to generate a PNG of an AppMap named `example`, but with two packages named `com.techcom.models` and `com.techcom.views` expanded into their constituent classes on separate lifelines:

```
appmap sequence-diagram --expand package:com/techcom/models --expand package:com/techcom/views example.appmap.json
```

### sequence-diagram-diff

```
appmap sequence-diagram-diff base-diagram head-diagram

Diff sequence diagrams that are represented as JSON

Positionals:
  base-diagram  base diagram file or directory to compare             [required]
  head-diagram  head diagram file or directory to compare             [required]

Options:
      --version     Show version number                                [boolean]
  -v, --verbose     Run with verbose logging                           [boolean]
      --help        Show help                                          [boolean]
  -d, --directory   program working directory                           [string]
      --output-dir  directory in which to save the sequence diagrams
                                                                  [default: "."]
      --format      output format
                             [choices: "plantuml", "json"] [default: "plantuml"]
```


## `openapi`

```console
$ appmap openapi --help
```
{: .example-code}

```
  appmap openapi

  Generate OpenAPI from AppMap Data in a directory

  Options:
        --version           Show version number                          [boolean]
    -v, --verbose           Run with verbose logging                     [boolean]
        --help              Show help                                    [boolean]
        --appmap-dir        directory to recursively inspect for AppMap Data
                                                          [default: "tmp/appmap"]
    -o, --output-file       output file name
        --openapi-template  template YAML; generated content will be placed in the
                            paths and components sections
        --openapi-title     info/title field of the OpenAPI document
        --openapi-version   info/version field of the OpenAPI document
```

Use this command to generate OpenAPI documentation from all AppMap Data in a directory
(recursively explored).

`openapi` ships with a default `yml` template but you can use a custom template if
you specify its file with the optional `--openapi-template` parameter.

The `--openapi-title` and `--openapi-version` parameters override the values of the
`info/title` and `info/version` properties in the generated document. 

## `stats`

Use this command to show statistics about events from a single AppMap Diagram or all diagrams in a directory.

### Usage

The `stats` command takes a directory of AppMap Data and will identify the largest diagrams, and will also 
calculate which functions have the highest AppMap overhead.  You can use this data alongside the `prune` command 
to reduce the size of your AppMap Diagram or remove noisy functions.  To target a specific AppMap use the `--appmap-file` 
option with the name of the map. 

For example:


To get statistics for all the AppMap Data in a directory, this will look recursively in all directories below `tmp/appmap`:
```
$ appmap stats tmp/appmap
✔ Computing AppMap stats...

Largest AppMaps (which are bigger than 1024kb)
1.5MB minitest/Microposts_interface_micropost_interface.appmap.json
1.5MB minitest/Valid_login_redirect_after_login.appmap.json
1.1MB minitest/Invalid_password_login_with_valid_email_invalid_password.appmap.json

✔ Computing functions with highest AppMap overhead...

Total instrumentation time
1947ms

Functions with highest AppMap overhead
     Time |     % |   Count | Function name
    546ms | 28.1% |    2082 | sprockets/Sprockets::EncodingUtils.unmarshaled_deflated
    268ms | 13.8% |    2082 | ruby/Marshal.load
    180ms |  9.2% |    3211 | ruby/Array#pack
    154ms |  7.9% |     375 | actionview/ActionView::Resolver#find_all
     85ms |  4.4% |    2054 | logger/Logger::LogDevice#write
     64ms |  3.3% |       7 | app/mailers/UserMailer#account_activation
     61ms |  3.1% |     120 | ruby/Marshal.dump
     59ms |    3% |       9 | app/mailers/UserMailer#password_reset
     58ms |    3% |     517 | openssl/OpenSSL::Random.random_bytes
     52ms |  2.7% |    1042 | activesupport/ActiveSupport::Callbacks::CallbackSequence#invoke_after
```
{: .example-code}

To get stats for an individual AppMap, pass the full directory where the AppMap lives, and use the `--appmap-file` option 
to list the name of the AppMap.

Example: 

```
$ appmap stats tmp/appmap/pytest --appmap-file tests_integration_catalogue_test_category_TestCategoryFactory_test_can_use_alternative_separator.appmap.json
Analyzing AppMap: /tmp/appmap/pytest/tests_integration_catalogue_test_category_TestCategoryFactory_test_can_use_alternative_separator.appmap.json

1. function:oscar/apps/catalogue/abstract_models/AbstractCategory#get_ancestors_and_self
      count: 131033
      estimated size: 48.8 MB

2. function:oscar/apps/catalogue/categories.create_from_sequence
      count: 3
      estimated size: 1.2 KB

3. function:oscar/apps/catalogue/abstract_models/AbstractCategory#save
      count: 3
      estimated size: 1.7 KB

4. function:oscar/apps/catalogue/abstract_models/AbstractCategory#generate_slug
      count: 3
      estimated size: 1.1 KB

5. function:oscar/core/utils.slugify
      count: 3
      estimated size: 794.0 bytes
```
{: .example-code}

### Arguments

```console
$ appmap stats --help
```
{: .example-code}

```
appmap stats [directory]

Show statistics about events from an AppMap or from all diagrams in a directory

Options:
      --version      Show version number                               [boolean]
  -v, --verbose      Run with verbose logging                          [boolean]
      --help         Show help                                         [boolean]
  -d, --directory    program working directory                          [string]
      --appmap-dir   directory to recursively inspect for AppMap Data
  -f, --format       How to format the output
                                     [choices: "json", "text"] [default: "text"]
  -l, --limit        Number of methods to display         [number] [default: 10]
  -a, --appmap-file  AppMap to analyze                                  [string]
```

## `prune`

Use this command to remove events from an AppMap, to make it have better performance, and to make it easier to understand.

Pruning works by finding the most repetitive calls in the map and then removing events associated with those calls. Non-application events such as HTTP requests and SQL queries will always be retained.

### Usage

The `prune` command expects either a `--size` argument or a `--filter` argument. It will not work if neither are provided. Using the `--size` argument allows you to automatically shrink the AppMap file to a specified file size, while the `--filter` option allows you to specify what events to remove.

### Arguments

You must provide either a `--size` argument or a `--filter` argument. You can find more information about the prune command by using the `--help` argument:

```console
$ appmap prune --help
```
{: .example-code}

```
appmap prune <file>

Make an appmap file smaller by removing events

Positionals:
  file  AppMap to prune                                               [required]

Options:
      --version      Show version number                               [boolean]
  -v, --verbose      Run with verbose logging                          [boolean]
      --help         Show help                                         [boolean]
  -o, --output-dir   Specifies the output directory      [string] [default: "."]
      --format       How to format the output
                                     [choices: "json", "text"] [default: "text"]
  -s, --size         Prune input file to this size    [string] [default: "15mb"]
  -d, --directory    Working directory for the command                  [string]
      --filter       Filter to use to prune the map                     [string]
      --output-data  Whether to output all AppMap Data or just output what was
                     removed                                           [boolean]
```

### Prune to a specific file size

The simplest way to use the `prune` command is to provide a target size for the map. The prune command will automatically 
remove functions until the desired size is reached. Using the `prune` command in this way does not give you control over what
gets removed, but often times the removed functions are relatively uninteresting (getters, setters, etc.).

### Prune specific events

The most powerful way to use the `prune` command is to pass it specific instructions about which events to remove. This is done by
using the `--filter` option. Here are the steps for using this technique:

1. Open an AppMap in the code editor.
2. Use the filtering available in the AppMap to hide certain events. ![AppMap Filtering](/assets/img/docs/using_appmap_filter.jpg)
3. Open the command pallette using `CTRL+SHIFT+P` or `COMMAND+SHIFT+P` on macOS, type `AppMap: Copy Current AppMap State to Clipboard`, then hit `Enter`.
4. Use the copied state as the `--filter` argument to the `prune` command. The `prune` command will remove whatever was filtered in the AppMap in your code editor.

```shell
$ appmap prune <APPMAP_FILE> --filter eyJjdXJyZW50VmlldyI6InZpZXdTZXF1ZW5jZSIsImZpbHRlcnMi
```
{: .example-code}

## `archive`

Use this command locally, or in the [GitHub Action](/docs/integrations/github-actions) or [CircleCI](/docs/integrations/circle-ci), to build a compressed archive of AppMap Data from a directory containing AppMap Data. Running this command without additional options will result in a "full" archive created at `.appmap/archive/full/{git revision}.tar`. Example: `.appmap/archive/full/028e610386f2fc132c93e613f57011825a8ae6e0.tar`

### Usage

The `archive` command does not require any arguments to run, but must be run in a git project with a valid appmap.yml file with AppMap Data located in the directory defined by `appmap_dir:` in the configuration. 

### Arguments
```
appmap archive

Build an AppMap archive from a directory containing AppMap Data

Options:
      --version           Show version number                          [boolean]
  -v, --verbose           Run with verbose logging                     [boolean]
      --help              Show help                                    [boolean]
  -d, --directory         program working directory                     [string]
  -t, --type              archive type
                      [choices: "full", "incremental", "auto"] [default: "auto"]
  -r, --revision          revision identifier.

                          If not explicitly specified, the current git revision
                          will be used.
                          When this command is used in an CI server, it's best
                          to explicitly the provide the revision
                          from an environment variable provided by the CI
                          system, such as GITHUB_HEAD_SHA, because the
                          commit of the current git revision may not be the one
                          that triggered the build.                     [string]
      --output-dir        directory in which to save the output file. By
                          default, it's .appmap/archive/<type>.         [string]
  -f, --output-file       output file name. Default output name is
                          <revision>.tar                                [string]
      --analyze, --index  whether to analyze the AppMap Data
                                                       [boolean] [default: true]
      --max-size          maximum AppMap size that will be processed, in
                          filesystem-reported MB                   [default: 50]
      --filter            filter to apply to AppMap Data when normalizing them
                          into sequence diagrams                        [string]
      --thread-count      Number of worker threads to use when analyzing AppMap Data
                                                                        [number]
```

## `restore`
Use this command locally, or in the [GitHub Action](/docs/integrations/github-actions) or [CircleCI](/docs/integrations/circle-ci), to download the most current available AppMap Data from the available archives. The archived AppMap Data can be stored locally or within a GitHub artifact store (if you are using the [GitHub Integration](/docs/integrations/github-actions)).  The archive filename must match the git revision requested to be restored. 

### Usage

The `restore` command does not require any arguments to run. By default, it will look for a valid AppMap tarball in the following location: `.appmap/archive/{full,incremental}/{git revision}.tar`.  After finding a valid AppMap tarball in the default location, the command will extract the archive to the `.appmap/work/{git revision}` directory.

### Arguments
```
appmap restore

Restore the most current available AppMap Data from available archives

Options:
      --version      Show version number                               [boolean]
  -v, --verbose      Run with verbose logging                          [boolean]
      --help         Show help                                         [boolean]
  -d, --directory    program working directory                          [string]
  -r, --revision     revision to restore                                [string]
      --output-dir   directory in which to restore the data. Default:
                     .appmap/work/<revision>                            [string]
      --archive-dir  directory in which the archives are stored
                                           [string] [default: ".appmap/archive"]
      --github-repo  Fetch AppMap archives from artifacts on a GitHub
                     repository. GITHUB_TOKEN must be set for this option to
                     work.                                              [string]
      --exact        fail unless the specific revision requested is available to
                     be restored                      [boolean] [default: false]
```

## `compare`

Use this command locally, or in the [GitHub Action](/docs/integrations/github-actions) or [CircleCI](/docs/integrations/circle-ci), to compare code behavior by analyzing two sets of AppMap Diagrams from different git revisions. 
### Usage

The `compare` command requires `--base-revision` to be passed to the command with a valid git SHA (i.e. `028e610386f2fc132c93e613f57011825a8ae6e0`). The head revision will be inferred based on the current git HEAD SHA for the git project in the current working directory.  

When comparing two git revisions, you will need to use the [`restore`](#restore) command configuration flag `--output-dir` and set the output directory to `appmap/change-report/$base_revision-$head_revision/{base,head}`.  For example if your base revision is `c01273ab4929e7d555aa8539f83c188aba42972d` and your head revision is `028e610386f2fc132c93e613f57011825a8ae6e0`, you will need to run the restore command on both revisions making sure your `--output-dir` looks like the following:

For the head revision (i.e. `028e610386f2fc132c93e613f57011825a8ae6e0`):
`--output-dir .appmap/change-report/$base_revision-$head_revision/head`
Example:
`--output-dir .appmap/change-report/c01273ab4929e7d555aa8539f83c188aba42972d-028e610386f2fc132c93e613f57011825a8ae6e0/head`

For the base revision (i.e. `c01273ab4929e7d555aa8539f83c188aba42972d`):
`--output-dir .appmap/change-report/$base_revision-$head_revision/base`
Example:
`--output-dir .appmap/change-report/028e610386f2fc132c93e613f57011825a8ae6e0-c01273ab4929e7d555aa8539f83c188aba42972d/base`

Both `base` and `head` directories will require restored AppMap Data before `compare` will run.  

After successfully running, `compare` will output a `diff` directory of AppMap Diagrams and a `change-report.json` within the `.appmap/change-report/$base_revision-$head_revision/` directory.
 
### Arguments
```
appmap compare

Compare runtime code behavior between base and head revisions

Options:
      --version                             Show version number        [boolean]
  -v, --verbose                             Run with verbose logging   [boolean]
      --help                                Show help                  [boolean]
  -d, --directory                           program working directory   [string]
  -b, --base-revision, --base               base revision name or commit SHA.
                                                                      [required]
  -h, --head-revision, --head               head revision name or commit SHA. By
                                            default, use the current commit.
      --output-dir                          directory in which to save the
                                            report files. Default is
                                            ./.appmap/change-report/<base-revisi
                                            on>-<head-revision>.
      --clobber-output-dir                  remove the output directory if it
                                            exists    [boolean] [default: false]
      --source-dir                          root directory of the application
                                            source code  [string] [default: "."]
      --delete-unreferenced,                whether to delete AppMap Data from 
      --delete-unchanged                    base and head that are unreferenced by
                                            the change report    [default: true]
      --report-removed                      whether to report removed findings,
                                            such as removed API routes, resolved
                                            findings, etc        [default: true]
  ```

## `compare-report`

Use this command locally, or in the [GitHub Action](/docs/integrations/github-actions) or [CircleCI](/docs/integrations/circle-ci), to generate a report document from comparison data generated by the [compare](#compare) command. 

### Usage

The `compare-report` command expects the `compare` command to have successfully executed against two git revisions and generated a `change-report.json` file. The `compare-report` command expects the first argument passed to it is the directory containing the `change-report.json`. 

Example: `appmap compare-report .appmap/change-report/$base_revision-$head_revision`

### Arguments
```
appmap compare-report <report-directory>

Generate a report document from comparison data generated by the compare
command.

Positionals:
  report-directory  directory containing the comparison data [string] [required]

Options:
      --version     Show version number                                [boolean]
  -v, --verbose     Run with verbose logging                           [boolean]
      --help        Show help                                          [boolean]
      --source-url  Base URL to link to a source file. The relative path to the
                    source file will be added to the URL path.          [string]
      --appmap-url  Base URL to link to AppMap Data. A 'path' parameter will be
                    added with the relative path from the report directory to
                    the AppMap JSON file.                               [string]
  -d, --directory   program working directory                           [string]
```
## GitHub repository

[https://github.com/getappmap/appmap-js/tree/main/packages/cli](https://github.com/getappmap/appmap-js/tree/main/packages/cli)
