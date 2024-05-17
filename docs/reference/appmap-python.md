---
layout: docs
title: Docs - Reference
description: "AppMap reference documentation for AppMap Python. Learn installation, configuration, tests, request recording, decorators, and environment variables."
toc: true
reference: true
name: AppMap Agent for Python
step: 5
---

# AppMap Agent for Python
- [About](#about)
  - [Supported versions](#supported-versions)
- [Installation](#installation)
- [Configuration](#configuration)
- [Enabling and disabling recording](#enabling-and-disabling-recording)
  - [`appmap-python` script](#appmap-python-script)
- [Test recording](#test-recording)
  - [pytest](#pytest)
  - [unittest](#unittest)
- [Request recording](#request-recording)
- [Remote recording](#remote-recording)
- [Code Block Recording](#code-block-recording)
- [Web framework support](#web-framework-support)
  - [Django](#django)
  - [Flask](#flask)
  - [FastAPI](#fastapi)
    - [uvicorn](#uvicorn)
    - [Other ASGI servers](#other-asgi-servers)
- [Decorators](#decorators)
  - [@appmap.labels](#appmaplabels)
  - [@appmap.noappmap](#appmapnoappmap)
- [Environment variables](#environment-variables)
  - [Controlling recording](#controlling-recording)
  - [Other configuration](#other-configuration)
- [GitHub repository](#github-repository)

## About

`appmap` is a Python package for creating [AppMap Diagrams](https://github.com/getappmap/appmap) of
your code.

{% include docs/what_is_appmap_snippet.md %}

`appmap` works by modifying the way python imports the modules of an application. After a module is
imported, `appmap` examines it for function definitions. Each function is instrumented, so that when
it is called, a trace event will be added to the current recording.

### Supported versions

{% include docs/python_support_matrix.html %}

Support for new versions is added frequently, please check back regularly for updates.

## Installation
`appmap` works best when installed in a virtual environment, usually one associated with a project.
This helps ensure that the project's code will be instrumented, while reducing the chance of
interference with other python utilities.

If your project uses `pip` for dependency management, add the `appmap` package to the project's
requirements file or install it directly. Specifying the `--require-virtualenv` switch ensures that
it will only be installed in a virtual environment.

```shell
pip install --require-virtualenv appmap
```
{: .example-code}

For projects that use `poetry` , add the `appmap` package to `pyproject.toml`. Note that, by
default, `poetry` manages dependencies using a virtual environment.

```
poetry add --group=dev appmap
```
{: .example-code}

`pipenv` is also supported. Like `poetry`, `pipenv` installs dependencies in a virtual environment.

```
pipenv install --dev appmap
```
{: .example-code}

{% include docs/install_appmap_extension.md %}

## Configuration

`appmap` is configured using a YAML file. By default, `appmap` looks in the current working
directory for a file named `appmap.yml`.

`appmap.yml` contains information used to create AppMap Data files. It allows you to specify the
application's name, as well as the modules that should be instrumented.

For each module, add the fully-qualified module name as the value of a `path` property. These names
should be in the format used in an `import` statement:

```
  name: my_python_app
  packages:
  - path: app.mod1
    shallow: true
  - path: app.mod2
    exclude:
    - MyClass
    - MyOtherClass.my_instance_method
    - MyOtherClass.my_class_method
  # You can record dependency packages, such as Django.
  # We don't recommend recording Django by default though, your AppMap Diagram will be quite large
  # and mostly about Django itself, not your own code.
  #- dist: Django
  #  exclude:
  #  - django.db
```
Notes about this example:
* The application has two modules that will be recorded: `app.mod1` and
  `app.mod2`. When the python interpreter imports one of those modules (e.g. by evaluating `import
  app.mod1`, `from app import mod1`, `from app import *`, etc), `appmap` will instrument the
  functions in the imported module.

  If the value of a `path` property cannot be parsed as a module name, `appmap` will issue an error
  and exit.

* An `exclude` is resolved relative to the associated path. So, for example, this configuration
  excludes `app.mod2.MyClass`.

* An external [distribution
  package](https://packaging.python.org/glossary/#term-Distribution-Package) can be specified using
  the `dist` specifier. The names are looked up in the [database of installed Python
  distributions](https://www.python.org/dev/peps/pep-0376/). This is generally the same package name
  as you'd give to `pip install` or put in `pyproject.toml`. You can additionally use `path` and
  `exclude` on `dist` entries to limit the capture to specific patterns.

By default, shallow capture is enabled on `dist` packages, suppressing tracking of most internal
execution flow. This allows you to capture the interaction without getting bogged down with detail.
To see these details, set `shallow: false`. You can also use `shallow: true` on `path` entries.

## Enabling and disabling recording

In the simplest case, AppMap recording can be either "enabled" or "disabled". When it's enabled, AppMap
data files will be created whenever a supported test case is run, and whenever a web request is
served. The remote recording endpoint will also be available. Recording of test cases, requests, and
remote recording can be further controlled with [additional environment
variables](#controlling-recording). When it's disabled, no application code will be instrumented, and
no AppMap files will be created.

Currently, AppMap is enabled by default. So if your python environment (either global, or in a
virtualenv) has the `appmap` package installed, AppMap will (a) instrument your python code whenever
you run a python program, and (b) the enabled behavior described above will be applied.

In the upcoming version 2 of the `appmap` package, the default behavior will change: AppMap will be
disabled by default. To enable AppMap, you can either (a) launch your python program with the new
`appmap-python` launch script, or (b) set the `APPMAP` environment variable (e.g. `export APPMAP=true`
in Bash, `$Env:APPMAP="true"` in PowerShell, etc).

### `appmap-python` script
```
% appmap-python --help
usage: appmap-python [-h] [--record unittest,requests,remote,pytest,process] [--no-record unittest,requests,remote,pytest,process] [--enable-log | --no-enable-log] [command ...]

Enable recording of the provided command, optionally specifying the
type(s) of recording to enable and disable. If a recording type is
specified as both enabled and disabled, it will be enabled.

This command sets the environment variables described here:
https://appmap.io/docs/reference/appmap-python.html#controlling-recording.
For any recording type that is not explicitly specified, the
corresponding environment variable will not be set.

If no command is provided, the computed set of environment variables
will be displayed.

positional arguments:
  command               the command to run (default: display the environment variables)

options:
  -h, --help            show this help message and exit
  --record unittest,requests,remote,pytest,process
                        recording types to enable
  --no-record unittest,requests,remote,pytest,process
                        recording types to disable
  --enable-log, --no-enable-log
                        create a log file (default: False)
```
## Test recording

`appmap` supports recording [pytest](https://pytest.org) and
[unittest](https://docs.python.org/3/library/unittest.html) test cases.

### pytest

`appmap` is a `pytest` plugin. When it's installed in a project that uses
`pytest`, it will be available to generate AppMap Diagrams by default.

```
root@e9987eaa93c8:/src/appmap/test/data/pytest# pip show appmap
Name: appmap
Version: 0.0.0
Summary: Create AppMap files by recording a Python application.
Home-page: None
Author: Alan Potter
Author-email: alan@app.land
License: None
Location: /usr/local/lib/python3.9/site-packages
Requires: orjson, PyYAML, inflection
Required-by:
root@e9987eaa93c8:/src/appmap/test/data/pytest# APPMAP_LOG_LEVEL=info pytest -svv
[2021-02-10 11:37:59,345] INFO root: appmap enabled: True
[2021-02-10 11:37:59,350] INFO appmap._implementation.configuration: ConfigFilter, includes {'simple'}
[2021-02-10 11:37:59,350] INFO appmap._implementation.configuration: ConfigFilter, excludes set()
===================================================================== test session starts =====================================================================
platform linux -- Python 3.9.1, pytest-6.2.2, py-1.10.0, pluggy-0.13.1 -- /usr/local/bin/python
cachedir: .pytest_cache
rootdir: /src, configfile: pytest.ini
plugins: appmap-0.0.0
collected 1 item

test_simple.py::test_hello_world [2021-02-10 11:37:59,482] INFO appmap.pytest: starting recording /tmp/pytest/test_hello_world.appmap.json
[2021-02-10 11:37:59,484] INFO appmap._implementation.configuration: included class simple.Simple
[2021-02-10 11:37:59,484] INFO appmap._implementation.configuration: included function simple.Simple.hello
[2021-02-10 11:37:59,489] INFO appmap._implementation.configuration: included function simple.Simple.hello_world
[2021-02-10 11:37:59,490] INFO appmap._implementation.configuration: included function simple.Simple.world
[2021-02-10 11:37:59,828] INFO appmap.pytest: wrote recording /tmp/pytest/test_hello_world.appmap.json
PASSED

====================================================================== 1 passed in 0.45s ======================================================================
```

### unittest

A subclass of `unittest.TestCase` is instrumented automatically, and an AppMap is recorded for each
`test_*` function in the subclass.

## Request recording

`appmap-python` can automatically record and save an AppMap for each HTTP server request. To do this, the AppMap agent hooks into the web server request processing framework. It starts a recording when each new request is received,
records the execution thread into an AppMap, and saves in when the request is completed.

**Note** Your application must be running in a supported web framework for request recording to work.

## Remote recording

The AppMap agent supports remote recording of web applications during development. When your application is run with debugging support, remote recording will be enabled automatically.

To enable debugging support, ensure:

* **Django** `DEBUG = True` in settings.py
* **Flask** run with the `--debug` option

**Note** Your application must be running in a supported web framework for remote recording to work.

## Code Block Recording

You can use `appmap.record` as a context manager to record a specific span of code. With this method, you can control exactly
what code is recorded, and where the recording is saved.

Given a source file `record_sample.py`:

```
import os
import sys
from datetime import datetime
from pathlib import Path

import appmap

output_directory = Path('tmp/appmap/codeblock')
output_directory.mkdir(parents=True, exist_ok=True)  # Step 2: Ensure the directory exists

timestamp = datetime.now().isoformat(timespec='seconds')
output_file = output_directory / f'{timestamp}.appmap.json'

r = appmap.Recording()
with r:
    import sample
    print(sample.C().hello_world(), file=sys.stderr)

with open(output_file, "w") as f:
    f.write(
        appmap.generation.dump(
            r,
            {
                "name": str(timestamp),
                "recorder": {
                    "type": "process",
                    "name": "process",
                },
            },
        )
    )
```

and a source file `sample.py`:

```
class C:
    def make_str(self, s):
        return s;

    def hello_world(self):
        return f'{self.make_str("Hello")} {self.make_str("world!")}'
```

as well as `appmap.yml`:

```
name: sample
packages:
- path: sample
language: python
appmap_dir: tmp/appmap
```

you can generate a recording of the code

```
% python record_sample.py
% jq '.events | length' tmp/appmap/codeblock/*.appmap.json
6
% jq < tmp/appmap/codeblock/*.appmap.json | head -10
{
  "version": "1.9",
  "metadata": {
    "language": {
      "name": "python",
      "engine": "CPython",
      "version": "3.10.13"
    },
    "client": {
      "name": "appmap",
```

## Web framework support

`appmap-python` integrates with the Django, Flask, and FastAPI web frameworks. When an application is started in a development environment, it inserts itself into the application's request processing stack. This enables recording of requests, as well as support for the [AppMap remote recording API](./remote-recording-api).

### Django

To start a Django app with AppMap integration enabled, add
```
DEBUG = True
```
to your application's `settings.py`.

### Flask

When `flask` is invoked with the `--debug` switch, debugging is enabled, as well as AppMap integration.

### FastAPI
The FastAPI integration supports both request recording and remote recording. Request
recording is enabled by default. When running during application development,
remote recording can also be enabled.

#### uvicorn
To create remote recordings of a FastAPI application run with `uvicorn`, use the
`--reload` switch:

```
$ uvicorn main:app --reload
INFO:     Will watch for changes in these directories: ['/Users/example/fastapiapp']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [57259] using StatReload
INFO:     Started server process [57261]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```
#### Other ASGI servers
To create remote recordings with other ASGI servers, you must modify your application code to add the agent's middleware. For example:

```
from fastapi import FastAPI, HTTPException, Request
import appmap.fastapi

app = FastAPI()

@app.get("/")
def root():
    return {"hello":"world"}

app = appmap.fastapi.Middleware(app, remote_enabled=True).init_app()
```
Remote recordings will be enabled when `remote_enabled` is `True`.

## Decorators

### @appmap.labels

The [AppMap Data Format](https://github.com/getappmap/appmap) provides for class and
function `labels`, which can be used to enhance the AppMap Diagrams, and to
programmatically analyze the data.

You can apply function labels using the `appmap.labels` decorator in your Python code. To
apply a label to a function, decorate the function with `@appmap.labels`.

For example, to label a function as an authentication provider:
```
import appmap

class ApiKey
  @appmap.labels('provider.authentication', 'security')
  def authenticate(self, key):
      # logic to verify the key here...
```

Then the AppMap metadata section for this function will include:

```
  {
    "name": "authenticate",
    "type": "function",
    "labels": [ "provider.authentication", "security" ]
  }
```

### @appmap.noappmap
The `@appmap.noappmap` decorator can be used to disable recording of `pytest` and `unittest` tests. If applied to a specific function, that function will not generate an AppMap. Alternatively, it can be applied to a test class to disable generation of AppMap Data for all tests in the class.

For example:
```
import appmap

def test_test1():
    ...

@appmap.noappmap
def test_test2():
    ....
```
When the tests above are executed, `test_test1` will generate an AppMap, but `test_test2` will not.

For example, to decorate a test class:

```
import unitest

import appmap

@appmap.noappmap
class TestNoAppMaps(unittest.TestCase):
    def test_test1(self):
        ...

    def test_test2(self):
        ...
```

When functions within `TestNoAppMaps` are executed, no AppMap Data will be generated.

## Environment variables

### Controlling recording
These variables control the types of recordings generated by the agent. The values of the variables are not case-sensitive.

* `APPMAP` controls all instrumentation and recording. When unset, or explicitly set to `true`, all application code will be instrumented, and the generation of recordings will be controlled by the variables below. When set to `false`, application code will run as if the AppMap agent was not installed.

Note that, as described above, the default behavior will change in version 2: by default (or if `APPMAP` is set to `false`), no code will be instrumented, and no recordings generated.

* `APPMAP_RECORD_<PYTEST|UNITTEST>` controls recording generation when test cases are run by `pytest` or `unittest`. When unset or set to `true`, each test case will generate a recording. When set to `false`, no recordings for individual test cases will be created. For example, to disable recording when using `pytest`, use `APPMAP_RECORD_PYTEST=false`:

```
$ env APPMAP_RECORD_PYTEST=false pytest
```
or
```
$ appmap-python --no-record pytest pytest
```

In version 2, these two variables will be combined into a single variable named `APPMAP_RECORD_TESTS`, controlling recording for these (and any future) test frameworks.

* `APPMAP_RECORD_REMOTE` controls the installation of the AppMap remote recording API. When unset, and run in a development environment (described [above](#web-framework-support)), remote recording will be enabled. When set to `true`, remote recording will always be enabled, regardless of environment. When set to `false`, remote recording will always be disabled.

Note that enabling remote recording other than in a development environment is a security risk, and `appmap` will issue a warning if you do so. However, sometimes the behavior of interest only occurs in some other environment. Setting `APPMAP_RECORD_REMOTE=true` allows this. For example, to enable remote recording for a Flask app started without debug, run:

```
$ env APPMAP_RECORD_REMOTE=true flask --app main.app
```
or
```
$ appmap-python --record remote flask --app main.app
```

* `APPMAP_RECORD_REQUESTS` controls creation of request recordings created when a web framework processes HTTP requests. When unset or `true`, request recordings will be created, otherwise they will not.

* `APPMAP_RECORD_PROCESS` controls recording of the entire python process that loads the agent. When
  `true`, recording starts when the agent is loaded. When the process exits, an AppMap will be
  created.

  **Important note:** process recording is not compatible with other recording methods. If you start
  a python process when `APPMAP_RECORD_PROCESS` is `true`, other attempts to create a recording will
  raise a `RuntimeError` with the message "Recording already in progress".

  For example, when `APPMAP_RECORD_PROCESS` is `true`, trying to start a request recording will
  raise this error. To avoid this, you should disable request recording. For example:

  ```
  $ appmap-python --record process --no-record requests flask --app main.app
  ```

  In addition, using code block recording, running tests, or starting a remote recording, will
  all raise this error and should not be attempted.

### Other configuration
These environment variables can be used to control various aspects of the AppMap agent.

* `APPMAP_CONFIG` specifies the configuration file to use. Defaults to `appmap.yml` in the
  current directory.

* `APPMAP_LOG_LEVEL` specifies log level to use, from the set `CRITICAL`, `ERROR`,
  `WARNING`, `INFO`, `DEBUG`. Not case-sensitive, defaults to `INFO`.

* `APPMAP_DISPLAY_PARAMS` enables rendering of parameters as strings. If `true` (the
  default, not case-sensitive), parameters are rendered using `repr`. If
  `false`, a generic string is used instead.

* `APPMAP_DISABLE_LOG_FILE` controls the automatic creation of a log file by the
  AppMap agent. If not `true` (the default), a log file will be created.


## GitHub repository

[https://github.com/getappmap/appmap-python](https://github.com/getappmap/appmap-python)
