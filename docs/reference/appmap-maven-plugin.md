---
layout: docs
title: Docs - Reference
description: "Integrate AppMap Maven plugin easily for test recording in Maven projects."
toc: true
reference: true
name: AppMap for Java - Maven Plugin
step: 7
---

# AppMap Maven plugin

- [AppMap Maven plugin](#appmap-maven-plugin)
  - [About](#about)
  - [Installation](#installation)
  - [Tests recording](#tests-recording)
  - [Plugin goals](#plugin-goals)
  - [Plugin configuration](#plugin-configuration)
  - [Configuring Surefire](#configuring-surefire)
  - [Troubleshooting](#troubleshooting)
  - [Running without modifying `pom.xml`](#running-without-modifying-pomxml)
  - [GitHub repository](#github-repository)

## About

The AppMap Maven Plugin provides a simple method for recording AppMap Data in running
tests in Maven projects and a seamless integration into CI/CD pipelines. The
client agent requires `appmap.yml` configuration file, see
[appmap-java](./appmap-java) for details.

## Installation

First, ensure you have a
[properly configured `appmap.yml`](./appmap-java#configuration)
in your root project directory.

Next, add the following plugin definition to your `pom.xml`:
```xml
<!-- the appmap plugin element goes to build/plugins -->
<plugin>
    <groupId>com.appland</groupId>
    <artifactId>appmap-maven-plugin</artifactId>
    <version>${appmap.maven-plugin-version}</version>
    <executions>
        <execution>
            <phase>process-test-classes</phase>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```
{: .example-code}

## Tests recording

The AppMap agent will automatically record your tests when you run
```shell
mvn test
```
{: .example-code}

By default, AppMap files are output to `tmp/appmap`.

## Plugin goals

- `prepare-agent` - adds the AppMap Java agent to the JVM
- `print-jar-path` - prints the path to the `appmap-agent.jar` file in the local Maven cache

Example:
```shell
mvn com.appland:appmap-maven-plugin:print-jar-path
```
{: .example-code}

or

```shell
mvnw com.appland:appmap-maven-plugin:print-jar-path
```
{: .example-code}

## Plugin configuration

- `configFile` Path to the `appmap.yml` config file. Default: _./appmap.yml_
- `outputDirectory` Output directory for `.appmap.json` files. Default:
  _./tmp/appmap_
- `skip` Agent won't record tests when set to true. Default: _false_
- `debug` Enable debug flags as a comma separated list. Accepts: `info`,
  `hooks`, `http`, `locals` Default: _info_
- `debugFile` Specify where to output debug logs. Default:
  _tmp/appmap/agent.log_
- `eventValueSize` Specifies the length of a value string before truncation
  occurs. If set to 0, truncation is disabled. Default: _1024_

  
## Configuring Surefire
Some configuration parameters of the Surefire plugin may prevent the appmap plugin
from being activated when the tests are run:
1. `forkCount` may not be set to `0`. Please set it to a value larger than `0` or
remove this configuration parameter from `pom.xml`
3. If `argLine` is specified, it must include `@{argLine}`

Example:
```
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>${maven-surefire-plugin.version}</version>
    <configuration>
        <forkCount>1</forkCount>
        <reuseForks>true</reuseForks>
        <argLine>
            @{argLine} --illegal-access=permit
        </argLine>
    </configuration>
</plugin>
```

## Troubleshooting

**I have no `tmp/appmap` directory**  
  It's likely that the agent is not running. Double check the `prepare-agent`
  goal is being run. If the JVM is being forked at any point, make sure the
  `javaagent` argument is being propagated to the new process. Additionally
  check that the Surefire plugin configuration is not preventing the agent
  from running. See ["Configuring Surefire"](#configuring-surefire) for more
  information.

**`*.appmap.json` files are present, but appear empty or contain little data**  
  Double check your `appmap.yml`. This usually indicates that the agent is
  functioning as expected, but no classes or methods referenced in the
  `appmap.yml` configuration are being executed. You may need to adjust the
  packages being recorded. Follow this link for more information:
  [AppMap java configuration](./appmap-java#configuration).

**My tests aren't running or I'm seeing `The forked VM terminated without
  properly saying goodbye.`**  
  Check the agent log (defaults to `tmp/appmap/agent.log`) and/or the
  Maven Surefire dumpstream (`target/surefire-reports/${DATETIME}.dumpstream`).
  This is typically indicative of an invalid `appmap.yml` configuration.

**I have a test failure that only occurs while the agent is attached**  
  Please open an issue at [getappmap/appmap-java](https://github.com/getappmap/appmap-java/issues).
  Attach a link to the source code or repository (if available), as well as any
  other relevant information including:
  - the contents of `appmap.yml`
  - the run command used (such as `mvn test`)
  - output of the run command
  - any Maven Surefire dumpstreams generated
    (`target/surefire-reports/${DATETIME}.dumpstream`)

## Running without modifying `pom.xml`
By specifying the fully-qualified goal, the agent can be run without any
additional configuration:
```sh
mvn com.appland:appmap-maven-plugin:prepare-agent test
```
{: .example-code}

## GitHub repository

[https://github.com/getappmap/appmap-maven-plugin](https://github.com/getappmap/appmap-maven-plugin)
