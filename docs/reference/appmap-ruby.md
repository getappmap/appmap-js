---
layout: docs
title: Docs - Reference
description: "AppMap reference guide for Ruby. Record AppMap Data easily for improved code visibility and analysis."
toc: true
reference: true
name: AppMap Agent for Ruby
step: 4
---

# AppMap Agent for Ruby <!-- omit in toc -->

- [About](#about)
  - [Supported versions](#supported-versions)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Events that are always recorded](#events-that-are-always-recorded)
- [Labels](#labels)
- [Tests recording](#tests-recording)
  - [RSpec](#rspec)
  - [Minitest](#minitest)
  - [Cucumber](#cucumber)
- [Requests recording](#requests-recording)
  - [Requests recording in Rails](#requests-recording-in-rails)
  - [Requests recording in non-Rails apps](#requests-recording-in-non-rails-apps)
- [Remote recording](#remote-recording)
  - [Remote recording in Rails](#remote-recording-in-rails)
  - [Remote recording in non-Rails apps](#remote-recording-in-non-rails-apps)
- [Code Block Recording](#code-block-recording)
- [Enable and disable AppMap Data creation](#enable-and-disable-appmap-data-creation)
  - [Disabling AppMap Data creation using environment variables](#disabling-appmap-data-creation-using-environment-variables)
  - [Disabling AppMap Data creation for specific RSpec tests](#disabling-appmap-data-creation-for-specific-rspec-tests)
- [Enabling and disabling instrumentation](#enabling-and-disabling-instrumentation)
- [Advanced runtime options](#advanced-runtime-options)
- [GitHub repository](#github-repository)

## About

`appmap` is a Gem for recording [AppMap Data](https://github.com/getappmap/appmap) of your code.

{% include docs/what_is_appmap_snippet.md %}

### Supported versions

{% include docs/ruby_support_matrix.html %}

Support for new versions is added frequently, please check back regularly for updates.

## Installation

Add `gem 'appmap'` to the **beginning** of your Gemfile. It needs to be the *first gem* in the list, so that it can observe other gems loading and instrument them if you request it. Also, we recommend you add the `appmap` gem to the `:development, :test` group. 

Your Gemfile should look something like this:

```
source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

# Optional Ruby version
# ruby '2.7.2'

# The appmap gem is the first gem in the file
group :development, :test do
  gem 'appmap'
end

# The rest of the gems follow
gem 'rails', '6.1.0'
```

Install with `bundle install`, as usual.

{% include docs/install_appmap_extension.md %}

## Configuration

When you run your program, the `appmap` gem reads configuration settings from _appmap.yml_. Here's an extensive example file for a Rails project:

```
# 'name' should generally be the same as the code repo name.
name: my_project
packages:
- path: app
  # Exclude sub-paths within the package path
  exclude:
  - concerns/accessor
- path :lib
# Include any gems that you want to record.
# These are just examples.
- gem: activerecord
- gem: aws-sdk
# Exclude a specific class or function from the map.
exclude:
- MyClass
- MyClass#my_instance_method
- MyClass.my_class_method
# Apply custom labels to gem code.
# (Use source annotations to label your own code).
functions:
- methods:
  - Fluent::Logger::FluentLogger#post
  - Fluent::Logger::FluentLogger#post_with_time
  - Fluent::Logger.post
  - Fluent::Logger.post_with_time
  label: log
```

* **name** Provides the project name (required)
* **packages** A list of source code directories which should be recorded.
* **exclude** A list of classes and/or methods to definitively exclude from recording.
* **functions** A list of specific functions, scoped by gem or path and fully qualified method name, to record.

**packages**

Each entry in the `packages` list is a YAML object which has the following keys:

* **path** The path to the source code directory. The path may be relative to the current working directory, or it may
  be an absolute path.
* **gem** As an alternative to specifying the path, specify the name of a dependency gem. When using `gem`, don't specify `path`. In your `Gemfile`, the `appmap` gem **must** be listed **before** any gem that you specify in your _appmap.yml_.
* **exclude** A list of files and directories which will be ignored. By default, all modules, classes and public
  functions are inspected. See also: global `exclude` list.
* **shallow** When set to `true`, only the first function call entry into a package will be recorded. Subsequent function calls within
  the same package are not recorded unless code execution leaves the package and re-enters it. Default: `true` when using `gem`,
  `false` when using `path`.

**exclude**

Optional list of fully qualified class and method names. Separate class and method names with period (`.`) for class methods and hash (`#`) for instance methods.

**functions**

Optional list of fully qualified `Class#instance_method` or `Class.class_method` method names. The primary use of `functions` is to apply specific labels to functions whose source code is not accessible (e.g., it's in a Gem).

- The `gem` or `path` name needs to match the actual location of the method(s)
- You can specify an individual `method` or multiple `methods` and a single `label` or multiple `labels`.

For functions which are part of the application code, use `@label` or `@labels` in code comments to apply labels.

### Events that are always recorded

Certain events are always recorded whenever AppMap recording is enabled. These events are:

* HTTP server requests that are handled by Rails.
* SQL queries that sent to the `ActiveSupport::Notifications` handler `sql.sequel`.
* SQL queries that sent to the `ActiveSupport::Notifications` handler `sql.active_record`.
* Specific functions that are identified and labeled by [lib/appmap/builtin_hooks](https://github.com/getappmap/appmap-ruby/tree/master/lib/appmap/builtin_hooks) and [lib/appmap/gem_hooks](https://github.com/getappmap/appmap-ruby/tree/master/lib/appmap/gem_hooks).

So, even if your _appmap.yml_ is empty except for a `name` and `packages: []`, your AppMap Data will still contain the events listed above.

## Labels

The AppMap Data specification provides for class and function `labels`, which can be used to enhance the AppMap Diagrams, and for code analysis.

You can apply function labels using source code comments in your Ruby code. To apply a labels to a function, add a `@label` or `@labels` line to the comment which immediately precedes a function.

For example, if you add this comment to your source code:

```ruby
class ApiKey
  # @labels provider.authentication security
  def authenticate(key)
    # logic to verify the key here...
  end
end
```
{: .example-code}

Then the AppMap metadata section for this function will include:

```
{
  "name": "authenticate",
  "type": "function",
  "labels": [ "provider.authentication", "security" ]
}
```
## Tests recording

### RSpec

When you run your RSpec tests, AppMap Data will be recorded automatically (as long as the `appmap` gem is loaded).

If you **don't see this working automatically** for some reason, you can try requiring `appmap/rspec` in your `spec_helper.rb`:

```ruby
require 'appmap/rspec'
```
{: .example-code}

Note that `spec_helper.rb` in a Rails project typically loads the application's classes this way:

```ruby
require File.expand_path("../../config/environment", __FILE__)
```
{: .example-code}

and `appmap/rspec` should be required before this:

```ruby
require 'appmap/rspec'
require File.expand_path("../../config/environment", __FILE__)
```
{: .example-code}

&nbsp;

Run the tests:

```
$ bundle exec rspec
```
{: .example-code}

Each RSpec test will output an AppMap file into the directory `tmp/appmap/rspec`. For example:

```
$ find tmp/appmap/rspec
Hello_says_hello_when_prompted.appmap.json
```

You can disable AppMap recording for specific tests and examples groups using the tag `appmap: false`. See the section on [enable and disable AppMap Data creation](#enable-and-disable-appmap-data-creation).

### Minitest

When you run your Minitest tests, AppMap Data will be recorded automatically (as long as the `appmap` gem is loaded).

If you **don't see this working automatically** for some reason, you can try requiring `appmap/minitest` in your `test_helper.rb`:

```ruby
require 'appmap/minitest'
```
{: .example-code}

Note that `test_helper.rb` in a Rails project typically loads the application's classes this way:

```ruby
require_relative '../config/environment'
```
{: .example-code}

and `appmap/minitest` must be required before this:

```ruby
require 'appmap/minitest'
require_relative '../config/environment'
```
{: .example-code}
&nbsp;

Run your tests as you normally would. For example:

```
$ rails test
```
{: .example-code}

or

```
$ bundle exec rake test
```
{: .example-code}

Each Minitest test will output an AppMap file into the directory `tmp/appmap/minitest`. For example:

```
$ find tmp/appmap/minitest
Hello_says_hello_when_prompted.appmap.json
```

### Cucumber

To record Cucumber tests, follow these additional steps:

1) Require `appmap/cucumber` in `support/env.rb`:

```ruby
require 'appmap/cucumber'
```
{: .example-code}

Be sure to require it before `config/environment` is required.

2) Create an `Around` hook in `support/hooks.rb` to record the scenario:


```ruby
if AppMap::Cucumber.enabled?
  Around('not @appmap-disable') do |scenario, block|
    appmap = AppMap.record do
      block.call
    end

    AppMap::Cucumber.write_scenario(scenario, appmap)
  end
end
```
{: .example-code}

3) Run the tests:

```
$ bundle exec cucumber
```
{: .example-code}

Each Cucumber test will output an AppMap file into the directory `tmp/appmap/cucumber`. For example:

```
$ find tmp/appmap/cucumber
Hello_Says_hello_when_prompted.appmap.json
```

## Requests recording

`appmap-ruby` can automatically record and save an AppMap for each HTTP server request.
To do this, the AppMap agent hooks into the Rack middleware. It starts a recording when each new request is received,
records the execution thread into an AppMap, and saves in when the request is completed.

Requests recording is enabled by default when `RAILS_ENV=development`. You can enable it in any environment by setting `APPMAP_RECORD_REQUESTS=true`, and disable it for every environment by setting `APPMAP_RECORD_REQUESTS=false`.

### Requests recording in Rails

The `appmap` middleware is injected automatically into the middleware stack of your Rails app by the AppMap Railtie.
To view the middleware stack of your app, and confirm that the AppMap middleware is configured and available,
run:

```
rake middleware
```
{: .example-code}

Start your Rails server in the normal way:

```
$ rails server
```
{: .example-code}

If you don't see a message indicating that "requests" recording is enabled, start the server with `APPMAP_RECORD_REQUESTS=true`, or ensure that `RAILS_ENV=development`.

### Requests recording in non-Rails apps

For non-Rails apps, add the AppMap middleware using the method provided by the framework you're using. Run your application server in the usual way. If you don't see a message indicating that "requests" recording is enabled, start the server with `APPMAP_RECORD_REQUESTS=true`, or ensure that `APP_ENV=development`.

## Remote recording

`appmap-ruby` supports the [AppMap remote recording API](./remote-recording-api). This functionality is provided by a Rack middleware.

Remote recording is enabled automatically when `Rails.env == 'development'` or `ENV['APP_ENV'] == 'development`. To enable remote recording in any other environment,
set `APPMAP_RECORD_REMOTE=true`.

To make a remote recording, follow the [Remote recording documentation](/docs/recording-methods.html#remote-recording).

### Remote recording in Rails

The `appmap` middleware is injected automatically into the middleware stack of your Rails app by the AppMap Railtie.
To view the middleware stack of your app, and confirm that the AppMap middleware is configured and available,
run:

```
rake middleware
```
{: .example-code}

Start your Rails server in the normal way:

```
$ rails server
```
{: .example-code}

If you don't see a message indicating that "remote" recording is enabled, start the server with `APPMAP_RECORD_REMOTE=true`, or ensure that `RAILS_ENV=development`.

### Remote recording in non-Rails apps

For non-Rails apps, add the AppMap middleware using the method provided by the framework you're using. Run your application server in the usual way.
If you don't see a message indicating that "remote" recording is enabled, start the server with `APPMAP_RECORD_REMOTE=true`, or ensure that `APP_ENV=development`.

## Code Block Recording

You can use `AppMap.record` record a specific block of code. With this method, you can control exactly
what code is recorded, and where the recording is saved.

An [example program](https://github.com/getappmap/land-of-applets/blob/b9b3063e4356802c51dd4fbc7ac64a925f0ba577/how-to-properly-close-a-netssh-connection_62643718/main.rb#L38) contains the following code, which should be illustrative of the method:

```ruby
require 'appmap'

# ... some other code

FileUtils.mkdir_p 'tmp/appmap/block'
appmap = AppMap.record do
  demo.call
end

File.write('tmp/appmap/block/demo.appmap.json', JSON.generate(appmap))
```
{: .example-code}

## Enable and disable AppMap Data creation

### Disabling AppMap Data creation using environment variables

To disable all AppMap recording, set the environment variable `APPMAP=false`.

To disable requests recording, set the environment variable `APPMAP_RECORD_REQUESTS=false`.

To disable remote recording, set the environment variable `APPMAP_RECORD_REMOTE=false`.

### Disabling AppMap Data creation for specific RSpec tests

To disable recording of an RSpec test or example group, use the tag `appmap: false`.

For example:

```ruby
describe 'Module 1', appmap: false do
  # AppMap Data is disabled for all tests in this scope.
  it 'does something'
  it 'does something else'
end

describe 'Module 2' do
  it 'does something', appmap: false do
    # AppMap is disabled for this test.
  end
  it 'does something else' do
    # AppMap is enabled for this test.
  end
end
```
{: .example-code}

## Enabling and disabling instrumentation

Bundler loads the `appmap` code when you load a gemset it's defined in (by default, `test` and `development`). When the `appmap` code is loaded,
it will instrument the other Ruby code according to the settings in your _appmap.yml_ file.

If you don't want `appmap` code to be loaded automatically by Bundler, you can conditionally disable it like this:

```
# The appmap gem is the first gem in the file
gem 'appmap', groups: %i[development test], require: ENV['APPMAP'] == 'true'
```

In this example, the `appmap` code will only be loaded when environment variable `APPMAP=true`.
If you prevent bundler from loading `appmap`, you can load it later on by using `require` in the usual way.
For example, in Rails `application.rb`:

```
require 'appmap'
```

Of course, if instrumentation is disabled in this way, then no AppMap Data will be recorded.

## Advanced runtime options

**`APPMAP_PROFILE_HOOK`**

`appmap-ruby` inspects and instruments code as it's loaded by the Ruby virtual machine.
Start your program with `APPMAP_PROFILE_HOOK=true` to see diagnostic information about how much time
it's taking `appmap-ruby` to instrument each Gem in your _appmap.yml_.

**`APPMAP_LOG_HOOK`**

Emit detailed logging about the instrumentation hooks that `appmap-ruby` adds to the code. By default, 
this information is logged to *appmap_hook.log*. See also: `APPMAP_LOG_HOOK_FILE`.

**`APPMAP_LOG_HOOK_FILE`**

Direct the hook logs to a different file. Specify a file name, or `APPMAP_LOG_HOOK_FILE=stderr`.

**`APPMAP_PROFILE_DISPLAY_STRING`**

`appmap-ruby` tries to include a useful string representation of each parameter and return value in the
AppMap. In some cases, there are pathological classes that take a long time to stringify.
Start your program with `APPMAP_PROFILE_DISPLAY_STRING=true` to see diagnostic information about how much time
it's taking `appmap-ruby` to stringify different object classes.

**`APPMAP_GEM_HOOKS_PATH`**

`appmap-ruby` ships with a default set of hooks that instrument and label popular Gems. The default list of hooks
can be extended with custom configuration so that Gems used in your application do not have to be explicitly
included and labeled in each _appmap.yml_. Set `APPMAP_GEM_HOOKS_PATH` to a folder with your custom hooks configuration `yaml`
files that use the _appmap.yml_ `functions` syntax.  See the [AppMap default hooks configuration](https://github.com/getappmap/appmap-ruby/blob/8080222ce5b61d9824eaf20410d7b9b94b679890/lib/appmap/gem_hooks) example (note: Gem names can be inferred from configuration file names if the `gem` property is missing).

**`APPMAP_RECORD_<CUCUMBER|MINITEST|RSPEC>`**

You can enable or disable recording for individual test frameworks using these environment variables.
For example, to manage recording when using `minitest`, use the variable APPMAP_RECORD_MINITEST`.

When `true` (the default), recording for the test type is always enabled.
When `false`, it's always disabled.

**`APPMAP_RECORD_REQUESTS`**

When `true` (the default), requests recording is always enabled.
When `false`, it's always disabled.

**`APPMAP_RECORD_REMOTE`**

When `true` (the default), remote recording is always enabled.
When `false`, it's always disabled.

**`APPMAP`**

When `true` (the default), all recording is enabled.
When `false`, all recording is disabled.

## GitHub repository

[https://github.com/getappmap/appmap-ruby](https://github.com/getappmap/appmap-ruby)

