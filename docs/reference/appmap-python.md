---
layout: docs
title: Docs - Reference
description: "AppMap reference documentation for AppMap Python. Learn installation, configuration, tests, request recording, decorators, and environment variables."
toc: true
reference: true
name: AppMap Agent for Python
step: 4
---

# AppMap Agent for Python
- [About](#about)
  - [Supported versions](#supported-versions)
- [Installation](#installation)
- [Configuration](#configuration)
- [Tests recording](#tests-recording)
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
  - [General configuration](#general-configuration)
  - [Controlling recording](#controlling-recording)
    - [Disabling recording methods](#disabling-recording-methods)
    - [Enabling recording methods](#enabling-recording-methods)
- [GitHub repository](#github-repository)

## About

`appmap` is a Python package for recording [AppMaps](https://github.com/getappmap/appmap) of your code.

{% include docs/what_is_appmap_snippet.md %}

### Supported versions

{% include docs/python_support_matrix.html %}

Support for new versions is added frequently, please check back regularly for updates.

## Installation

If your project uses `pip` for dependency management, add the `appmap` package to the requirements
file or install it directly with
```shell
pip install appmap
```
{: .example-code}

For projects that use `poetry` , add the `appmap` package to `pyproject.toml`.
```
poetry add --group=dev appmap
```
{: .example-code}

`pipenv` is also supported:
```
pipenv install --dev appmap
```
{: .example-code}

{% include docs/install_appmap_extension.md %}

## Configuration

Add your modules as `path` entries in `appmap.yml`, and external packages
(distributions) as `dist`:

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
  # We don't recommend recording Django by default though, your AppMaps will be quite large
  # and mostly about Django itself, not your own code.
  #- dist: Django
  #  exclude:
  #  - django.db
```

Note that an `exclude` is resolved relative to the associated path. So, for example, this
configuration excludes `app.mod2.MyClass`.

For external [distribution packages](https://packaging.python.org/glossary/#term-Distribution-Package)
use the `dist` specifier; the names are looked up in the
[database of installed Python distributions](https://www.python.org/dev/peps/pep-0376/).
This is generally the same package name as you'd give to `pip install` or put
in `pyproject.toml`. You can additionally use `path` and `exclude` on `dist`
entries to limit the capture to specific patterns.

By default, shallow capture is enabled on `dist` packages, supressing tracking
of most internal execution flow. This allows you to capture the interaction without
getting bogged down with detail. To see these details, set `shallow: false`.
You can also use `shallow: true` on `path` entries.

## Tests recording

`appmap` supports recording [pytest](https://pytest.org) and
[unittest](https://docs.python.org/3/library/unittest.html) test cases.

### pytest

`appmap` is a `pytest` plugin. When it's installed in a project that uses
`pytest`, it will be available to generate AppMaps.

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

import appmap

r = appmap.Recording()
with r:
    import sample
    print(sample.C().hello_world(), file=sys.stderr)

with os.fdopen(sys.stdout.fileno(), "w", closefd=False) as stdout:
    stdout.write(appmap.generation.dump(r))
    stdout.flush()
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
% python record_sample.py > record_sample.appmap.json
% jq '.events | length' record_sample.appmap.json
6
% jq < record_sample.appmap.json | head -10
{
  "version": "1.4",
  "metadata": {
    "language": {
      "name": "python",
      "engine": "CPython",
      "version": "3.9.1"
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

The [AppMap data format](https://github.com/getappmap/appmap) provides for class and
function `labels`, which can be used to enhance the AppMap visualizations, and to
programatically analyze the data.

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
The `@appmap.noappmap` decorator can be used to disable recording of `pytest` and `unittest` tests. If applied to a specific function, that function will not generate an AppMap. Alternatively, it can be applied to a test class to disable generation of AppMaps for all tests in the class.

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

When functions within `TestNoAppMaps` are executed, no AppMaps will be generated.

## Environment variables

### General configuration
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

### Controlling recording
These variables control the types of recordings generated by the agent.

#### Disabling recording methods
Some recording types are enabled by default. These variables allow you to disable them.

* `APPMAP_RECORD_<PYTEST|UNITTEST>` disables recording for individual test frameworks when set to `false`. For example, to disable recording when using `pytest`, use the variable `APPMAP_RECORD_PYTEST`.

* `APPMAP_RECORD_REQUESTS` disables recording of HTTP requests when set to `false`.

* `APPMAP_RECORD_REMOTE` disables remote recording when set to `false`.

* `APPMAP` controls all instrumentation and recording. When set to `false`, application code will run as if the AppMap agent was not installed.

#### Enabling recording methods
Some recording types are not enabled by default. These variables allow you to enable them

* `APPMAP_RECORD_PROCESS` controls recording of the entire python process that loads the agent. When `true`, recording starts when the agent is loaded. When the process exits, an AppMap will be created.

## GitHub repository

[https://github.com/getappmap/appmap-python](https://github.com/getappmap/appmap-python)
