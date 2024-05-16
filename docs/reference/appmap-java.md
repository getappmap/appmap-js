---
layout: docs
title: Docs - Reference
description: "AppMap Agent for Java records AppMap Data of your code. Learn about supported versions, tests, requests recording, remote recording, and annotations."
toc: true
reference: true
name: AppMap Agent for Java
step: 6
---

# AppMap Agent for Java

- [About](#about)
  - [Supported versions](#supported-versions)
- [Tests recording](#tests-recording)
  - [Using IntelliJ IDEA Run Configurations](#using-intellij-idea-run-configurations)
  - [Recording tests with Maven](#recording-tests-with-maven)
  - [Recording tests with Gradle](#recording-tests-with-gradle)
  - [Other build systems](#other-build-systems)
- [Requests recording](#requests-recording)
  - [Requests recording in Spring Boot and Spring Web Framework](#requests-recording-in-spring-boot-and-spring-web-framework)
  - [Requests recording in Spark Framework](#requests-recording-in-spark-framework)
- [Remote recording](#remote-recording)
- [Process recording](#process-recording)
- [Code Block Recording](#code-block-recording)
- [Configuration](#configuration)
- [Annotations](#annotations)
  - [@Labels](#labels)
    - [Usage](#usage)
  - [@NoAppMap](#noappmap)
    - [Usage](#usage-1)
- [System Properties](#system-properties)
- [GitHub repository](#github-repository)

## About

`appmap-agent` is a Java agent JAR for recording [AppMap Data](https://github.com/getappmap/appmap) of your code. 

{% include docs/what_is_appmap_snippet.md %}

### Supported versions

{% include docs/java_support_matrix.html %}

## Tests recording

### Using IntelliJ IDEA Run Configurations

If you're using JetBrains IntelliJ IDEA, we recommend using [run configurations to create AppMap Data](/docs/reference/jetbrains#create-appmap-data-from-junit-test-runs).

### Recording tests with Maven

Alternatively, you may record your tests with the
[AppMap Maven plugin](/docs/reference/appmap-maven-plugin#installation).

### Recording tests with Gradle

Alternatively, you may record your tests with the
[AppMap Gradle plugin](/docs/reference/appmap-gradle-plugin#installation).

### Other build systems

You can download the latest release of `appmap-agent-<version>.jar` from [https://mvnrepository.com/artifact/com.appland/appmap-agent/latest](https://mvnrepository.com/artifact/com.appland/appmap-agent/latest).

Both the AppMap plugin for IntelliJ and the AppMap extension for VS Code automatically download
the latest the AppMap Java agent, and store it locally in `$HOME/.appmap/lib/java/appmap.jar`.

The recorder is run as a Java agent. Currently, it must be started along with
the JVM. This is done by passing the `-javaagent` argument to your
JVM when recording tests. For example:

```shell
$ java -javaagent:$HOME/.appmap/lib/java/appmap.jar myapp.jar
```

## Requests recording
`appmap-java` can automatically record and save an AppMap for each HTTP server request which it processes. This functionality is currently supported for applications built using [Spring Boot](https://spring.io/projects/spring-boot), Servlet-stack web applications built using [Spring Framework](https://docs.spring.io/spring-framework/reference/web.html), and [Spark Framework](http://sparkjava.com/).

### Requests recording in Spring Boot and Spring Web Framework
For Spring Boot and Spring Web Framework applications, `appmap-java` installs a ServletListener during initialization that will create recordings. The listener starts the recording before the servlet's `service` method is called, and ends the recording once `service` returns.

For Spring Boot, `appmap-java` adds the listener when the Spring Application is initialized. 

For Spring Web Framework, `appmap-java` adds the listener when Spring's servlet container is initialized.

### Requests recording in Spark Framework
For Spark Framework, `appmap-java` wraps Sparks' Handler with a HandlerWrapper that manages recording.

## Remote recording

`appmap-java` supports the [AppMap remote recording API](/docs/reference/remote-recording-api).
This functionality is provided by the AppMap agent. It will hook into the Java servlets API, injecting the remote recording routes into the servlet chain.

**Note** Your application must be running in a servlet container (e.g. Tomcat, Jetty, etc.) for remote recording to work.

1. Start your application with the AppMap agent enabled
   1. [IntelliJ - "Start with Appmap"](/docs/reference/jetbrains.html#start-with-appmap-for-java)
   2. Command line - run your Servlet-based application with the `javaagent` JVM argument:

```shell
$ java -javaagent:$HOME/.appmap/lib/java/appmap.jar -jar target/*.jar
```

2. Start and stop the recording
   1. [IntelliJ](/docs/reference/jetbrains.html#remote-recording)
   2. [VSCode](/docs/reference/vscode.html#remote-recording)

## Process recording

`appmap-java` can record an entire Java process from start to finish.

1. Set the Java system property `appmap.recording.auto=true`. You must set this system property as a JVM argument.
  If you are using a graphical run configuration, add the option `-Dappmap.recording.auto=true` to the "VM options" field.
  If you are running on the command line, add the option `-Dappmap.recording.auto=true` to the JVM CLI arguments.

2. Start your application with the AppMap agent enabled using one of these approaches:
   1. [IntelliJ - "Start with Appmap"](/docs/reference/jetbrains.html#start-with-appmap-for-java)
   2. Command line - run your Servlet-based application with the `javaagent` JVM argument:

```shell
$ java -javaagent:$HOME/.appmap/lib/java/appmap.jar -jar target/*.jar
```

Other related options such as `appmap.recording.file` and `appmap.recording.name` are also available. Consult the [Configuration](#configuration) section for details.

## Code Block Recording

You can use the Java function `com.appland.appmap.record.Recording#record` to record a specific span of code. With this method, you can control exactly what code is recorded, and where the recording is saved.

This code snippet illustrates how to use the `record()` function to record a block of code, and then write the AppMap Data to a file:

```java
final Recorder recorder = Recorder.getInstance();

final MyClass myClass = new MyClass();
Recording recording = recorder.record(() -> {
  for (int i = 0; i < 10; i++) {
    myClass.myMethod();
  }
});
StringWriter sw = new StringWriter();
recording.readFully(true, sw);

// Now write the recorded AppMap Data to a file. The file name should end in ".appmap.json".
try (PrintWriter out = new PrintWriter("runnable-recording.appmap.json")) {
  out.println(sw.toString());
}
catch (FileNotFoundException ex) {
  ex.printStackTrace();
  System.exit(1);
}
```
{: .example-code}


## Configuration

When you run your program, the agent reads configuration settings from
`appmap.yml`. Here's a sample configuration file for a typical Java project:

```
# 'name' should generally be the same as the code repo name.
name: MyProject
language: java
appmap_dir: tmp/appmap
packages:
- path: com.mycorp.myproject
  exclude: [ com.mycorp.myproject.MyClass#MyMethod ]
- path: org.springframework.web
  shallow: true
  exclude: 
  - org.springframework.web.util
- path: java.util.logging
  methods:
  - class: Logger
    name: log

```

- **name** Provides the project name (required)
- **appmap_dir** The directory where AppMap Data will be saved by request recording. If unset, a default based on the project's build configuration file will be used.
- **packages** A list describing how packages should be instrumented. For backwards compatibility, classes and methods can also be specified here. New projects should use the `methods` property to specify which methods to instrument.

**packages**

Each entry in the `packages` list is a YAML object which has the following keys:

* **path** A Java package, class, or method that will be instrumented.
* **exclude** A list of fully-qualified sub-packages, sub-classes
  and sub-methods that will be ignored. The exclude list only applies to the
  `path` specified in the same package entry.

* **shallow** When set to `true`, only the first function call entry into a
  package will be recorded. Subsequent function calls within the same package
  are not recorded unless code execution leaves the package and re-enters it.
  Default: `false`.

* **methods** A list of YAML objects describing how specific methods should be handled.
  * **class** a regular expressiom matching names of classes in the package 
  * **name** a regular expression matching names of methods in **class** that should be instrumented
  * **labels** (optional) a list of labels that should be applied to all matching methods.

Each of the **class** and **name** regular expressions is a
[java.util.regex.Pattern
](https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html). They
will be surrounded with `\A(` `)\z` to match whole symbols. This means, in the
example above, `log` will match exactly that method of `Logger`, but not the
`logp` or `logrb` methods. To match all three methods, use `log(|p|rb)` or
`log.*`. To include the literal symbols `.` or `$` in the patterns, they must be
properly escaped: `\.` or `\$`.

If the **methods** attribute is specified for a package, each element in the
list will be matched in the order specified, and only the matching methods will
be instrumented. When the **methods** attribute is set, the **exclude**
attribute is ignored.

## Annotations
The `appmap-java` annotations are provided in the package `com.appland:appmap-annotation`, available on [Maven Central](https://search.maven.org/artifact/com.appland/appmap-annotation). To use them, add that package as a dependency in your build configuration file (`pom.xml`, `build.gradle`).

### @Labels
`appmap-java` suports the addition of [code labels](/docs/reference/appmap-java.html#annotations) through the `com.appland.appmap.annotation.Labels` annotation.

#### Usage
Once the `Labels` annotation is available, you can apply it to methods in your application. For example:

```
import com.appland.appmap.annotation.Labels;

public class ExampleClass {
  ...
  @Labels({"label1", "label2"})
  public void labeledFunction() {
    ...
  }
}
```

When `labeledFunction` appears in an AppMap, it will have the labels `label1` and `label2`.

### @NoAppMap
The `NoAppMap` annotation can be used to disable recording of JUnit test methods. If applied to a specific method, that method will not generate an AppMap. Alternatively, it can be applied to a test class to disable generation of AppMap Data for all test methods in the class.

#### Usage
Example of annotating a test method:

```
import com.appland.appmap.annotation.NoAppMap;
...

public class TestClass {
  @Test
  public void testMethod1() {
    ...
  }

  @NoAppMap
  @Test
  public void testMethod2() {
    ...
  }
}
```
`testMethod1` will generate an AppMap, and `testMethod2` will not.

Example of annotating a test class:
```
import com.appland.appmap.annotation.NoAppMap;
...

@NoAppMap
public class UnrecordedTestClass {
  @Test
  public void testMethod1() {
    ...
  }

  @Test
  public void testMethod2() {
    ...
  }
}
```
No AppMap Data will be generated for the tests in `UnrecordedTestClass`.

## System Properties

- `appmap.config.file` Path to the `appmap.yml` config file. Default:
  _appmap.yml_
- `appmap.output.directory` Output directory for `.appmap.json` files. Default:
  `./tmp/appmap`
- `appmap.debug` Enable debug logging. Default: `null` (disabled)
- `appmap.event.valueSize` Specifies the length of a value string before
  truncation occurs. If set to `0`, truncation is disabled. Default: `1024`
- `appmap.record.private` Record private methods, as well as methods with
  package and protected access. Default: `false` (no private methods will be
  recorded).
- `appmap.recording.auto` Automatically begin recording at boot time. Default:
  `false`
- `appmap.recording.file` The file name of the automatic recording to be
  emitted. Note that the file name will still be prefixed by
- `appmap.recording.requests` If `true`, create a recording for each HTTP server request (for
  supported frameworks). Default: `true`.
  `appmap.output.directory`. Default: `$TIMESTAMP.appmap.json`
- `appmap.recording.name` Populates the `metadata.name` field of the AppMap.
  Default: `$TIMESTAMP`


## GitHub repository

[https://github.com/getappmap/appmap-java](https://github.com/getappmap/appmap-java)

