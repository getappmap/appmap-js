---
layout: docs
title: Docs - Reference
description: "AppMap reference guide for the Gradle plugin which enables recording AppMap Data in Gradle projects."
toc: true
reference: true
name: AppMap for Java - Gradle Plugin
step: 8
---

# AppMap Gradle plugin

- [AppMap Gradle plugin](#appmap-gradle-plugin)
  - [About](#about)
  - [Installation](#installation)
  - [Tests recording](#tests-recording)
  - [Plugin tasks](#plugin-tasks)
  - [Plugin configuration](#plugin-configuration)
  - [Troubleshooting](#troubleshooting)
  - [GitHub repository](#github-repository)

## About

The [AppMap Gradle Plugin](https://plugins.gradle.org/plugin/com.appland.appmap)
provides simple method for recording AppMap Data in running
tests in Gradle projects, and a seamless integration into CI/CD pipelines. The
client agent requires `appmap.yml` configuration file, see
[appmap-java](./appmap-java/) for details.

## Installation

First, ensure you have a
[properly configured `appmap.yml`](./appmap-java#configuration)
in your root project directory.

Next, add the following plugin definition and configuration to your `build.gradle` or `build.gradle.kts`.

1. Add `com.appland.appmap` to plugins. You can find the latest plugin version on [plugins.gradle.org](https://plugins.gradle.org/plugin/com.appland.appmap). 

    Groovy:
    ```groovy
    plugins {
      // other plugins here

      id "com.appland.appmap" version "<latest-version>"
    }
    ```
    {: .example-code}

    Kotlin:
    ```kotlin
    plugins {

      id("com.appland.appmap") version "<latest-version>"
    }
    ```
    {: .example-code}

2. Add appmap configuration (_optional_)

   ```groovy
   // Set Up AppMap agent, default parameters
   appmap {
       configFile = file("$projectDir/appmap.yml")
       outputDirectory = file("$buildDir/appmap")
       skip = false
       debug = "info"
       debugFile = file("$buildDir/appmap/agent.log")
       eventValueSize = 1024
   }
   ```
   {: .example-code}

## Tests recording

The AppMap agent will automatically record your tests when you run
```
gradle appmap test
```
{: .example-code}

or 

```
gradlew appmap test
```
{: .example-code}

By default, AppMap files are output to `$buildDir/appmap`.

## Plugin tasks

- `appmap` - adds the AppMap Java agent to the JVM for the `test` task, must be explicitly called
- `appmap-validate-config` - validates if appmap.yml file exist, and it's readable
- `appmap-print-jar-path` - prints the path to the `appmap-agent.jar` file in the local Gradle cache 

## Plugin configuration

- `configFile` Path to the `appmap.yml` config file. Default: _./appmap.yml_
- `outputDirectory` Output directory for `.appmap.json` files. Default:
  _.$buildDir/appmap_
- `skip` Agent won't record tests when set to true. Default: _false_
- `debug` Enable debug flags as a comma separated list. Accepts: `info`,
  `hooks`, `http`, `locals` Default: _info_
- `debugFile` Specify where to output debug logs. Default:
  _$buildDir/appmap/agent.log_
- `eventValueSize` Specifies the length of a value string before truncation
  occurs. If set to 0, truncation is disabled. Default: _1024_

## Troubleshooting

**I have no `$buildDir/appmap` directory**  
It's likely that the agent is not running. Double check the `appmap` task is
being explicitly called and if the JVM is being forked at any point, make sure
the `javaagent` argument is being propagated to the new process.

**`*.appmap.json` files are present, but appear empty or contain little data**  
Double check your `appmap.yml`. This usually indicates that the agent is
functioning as expected, but no classes or methods referenced in the
`appmap.yml` configuration are being executed. You may need to adjust the
packages being recorded. Follow [this link](./appmap-java#configuration) for more information.


**My tests aren't running, or I'm seeing
`The forked VM terminated without properly saying goodbye.`**  
Check the agent log (defaults to `tmp/appmap/agent.log`) This is typically
indicative of an invalid `appmap.yml` configuration.

**I have a test failure that only occurs while the agent is attached**  
Please open an issue at
[getappmap/appmap-java](https://github.com/getappmap/appmap-java/issues).
Attach a link to the source code or repository (if available), as well as any
other relevant information including:

- the contents of `appmap.yml`
- the run command used (such as `gradle appmap test`)
- output of the run command

## GitHub repository

[https://github.com/getappmap/appmap-gradle-plugin](https://github.com/getappmap/appmap-gradle-plugin)
