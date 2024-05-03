---
layout: docs
title: Docs - Reference
description: "AppMap for JetBrains reference guide. Learn to use AppMap in your JetBrains code editor."
toc: true
reference: true
name: AppMap for JetBrains
step: 2
---

# AppMap for JetBrains

- [AppMap tool window](#appmap-tool-window)
- ["Start with AppMap" for Java](#start-with-appmap-for-java)
  - [Create AppMap Data from JUnit test runs](#create-appmap-data-from-junit-test-runs)
    - [Disable specific JUnit tests](#disable-specific-junit-tests)
  - [Running a Java application with AppMap](#running-a-java-application-with-appmap)
- [Remote recording](#remote-recording)
- [AppMap Plugin actions](#appmap-plugin-actions)
- [Generate OpenAPI Definitions](#generate-openapi-definitions)
- [Troubleshooting](#troubleshooting)
  - [Enable Debug Logging](#enable-debug-logging)
  - [Downloading Plugin Logs](#downloading-plugin-logs)
- [GitHub Repository](#github-repository)

## AppMap tool window

The AppMap tool window shows all AppMap Diagrams in your open projects. You can open it from the top level menu (`View -> Tools Windows -> AppMaps`), with an AppMap action or by clicking on its tab in the UI.

<img class="intellij-screenshot" src="/assets/img/intellij-appmap-tool-window.webp"/>

AppMap tool window actions:

- Alphabetical listing of all AppMap Diagrams in the project, sorted by name.
- Double-click on any AppMap to open it.
- Search for an AppMap by its name.
- Start/stop [remote recordings](#remote-recording).
- View the Quickstart guide.

## "Start with AppMap" for Java

**NOTE:** This section only applies to Java applications.

Installing the AppMap JetBrains plugin adds custom buttons and menu options to the JetBrains editor interface. These can be used to run your Java application code with AppMap automatically configured, saving you from manually changing your Maven or Gradle settings. This is the recommended approach for all Java users using JetBrains editors like IntelliJ.

For example, if you right click on your main class file you'll see a new menu item under "More Run/Debug" to `Start with AppMap`. Selecting this option will start your application with the AppMap libraries enabled.  From here, you can interact with your application to generate [request recordings](/docs/reference/appmap-java.html#requests-recording) or use [remote recording](#remote-recording)

<img class="intellij-screenshot" src="/assets/img/jetbrains-run-main-with-appmap.webp"/>

You can also use this custom button to run a specific test or group of tests with the `Start with AppMap` option. Similar to above, right click on a single test or a group of tests and use the custom button under "More Run/Debug" to `Start with AppMap`.

<img class="intellij-screenshot" src="/assets/img/jetbrains-run-test-with-appmap.webp"/>

{% include vimeo.html id='916087828' %}

### Create AppMap Data from JUnit test runs

1. [Install the JetBrains plugin](https://plugins.jetbrains.com/plugin/16701-appmap) if you haven't already.
2. Open your test file in the editor. Each method marked with JUnit's `@Test` annotation will produce an AppMap.
3. Run the test(s) with AppMap by clicking the icon next to the test class and then selecting "Start with AppMap", or by clicking the AppMap run configuration button:
<img class="intellij-screenshot" src="/assets/img/run-config-test.png"/>

#### Disable specific JUnit tests

To disable recording for a particular JUnit test (for example, a performance
test), list the class or methods under `exclude` in the project's `appmap.yml` configuration file.

### Running a Java application with AppMap

When you run a Java application with the AppMap agent, [remote recording](/docs/recording-methods.html#remote-recording) will be enabled. (Note: For this to work, your application must include a web server).

1. [Install the JetBrains plugin](https://plugins.jetbrains.com/plugin/16701-appmap) if you haven't already.
2. Open your application file in the editor.
3. Run your application with AppMap by clicking the icon next to the main class you wish to run and then selecting "Start with AppMap", or by clicking the AppMap run configuration button:
<img class="intellij-screenshot" src="/assets/img/run-config-start.png"/>
1. With the application running, follow the [remote recording](#remote-recording) instructions below to (starting at step 3) create AppMap Data.

## Remote recording

You can make a [remote recording](../recording-methods#remote-recording) from within the JetBrains IDE. 

1. [Install the JetBrains plugin](https://plugins.jetbrains.com/plugin/16701-appmap) if you haven't already.
2. Start your application with remote recording enabled. For Java, [run your Java application with AppMap](#running-a-java-application-with-appmap). For other languages, consult the [agent reference](/docs/reference) for details.
3. To start a recording, click the remote recording button, or use the command **Start AppMap recording**. 
<img class="intellij-screenshot" src="/assets/img/docs/intellij-remote-start.png"/>
4. Enter the URL where your application is running.
<img class="intellij-screenshot" src="/assets/img/docs/intellij-remote-url.png"/>
5. Interact with your app through its UI or API. Then click the button to stop the recording, or use the command **Stop AppMap recording**. 
<img class="intellij-screenshot" src="/assets/img/docs/intellij-remote-stop.png"/>
6. You'll be prompted to save the AppMap to a file, and it will be opened.
<img class="intellij-screenshot" src="/assets/img/docs/intellij-remote-save.png"/>

For more details about remote recording, see:

* [Recording methods > Remote recording](/docs/recording-methods)
* [Remote recording API](../reference/remote-recording-api)

## AppMap Plugin actions

To open the list of AppMap plugin actions, press `CTRL+SHIFT+A` on Windows and Linux, or `COMMAND+SHIFT+A` on macOS, and type `AppMap`. You can also find these actions at `Tools > AppMap` of the main menu.

The command names should be self-explanatory. 

## Generate OpenAPI Definitions

After [recording AppMap Data](/docs/recording-methods.html) for your project, select "Generate OpenAPI" from the AppMap instructions quick start in the lower right hand column. 

![Generate OpenAPI Link](/assets/img/openapi/jetbrains-1.webp)

Selecting the "Generate OpenAPI Definitions" button will open a new file with your OpenAPI definition document to save locally, share with your team or use with 3rd party API management tools [like Postman](https://blog.postman.com/new-postman-integration-with-appmap-create-and-manage-always-accurate-collections/)

![OpenAPI Generation Screen](/assets/img/openapi/jetbrains-2.webp)  

## Troubleshooting

### Enable Debug Logging

You can enable debug logging of the AppMap plugin in your JetBrains code editor by first opening `Help` > `Diagnostic Tools` > `Debug Log Settings`. 

![JetBrains Debug Log menu](/assets/img/jetbrains-debug-logs.webp)  

In the `Custom Debug Log Configuration` enter `appland` to enable DEBUG level logging for the AppMap plugin. 

![JetBrains Debug Log Configuration](/assets/img/jetbrains-logging-configuration.webp)  

Next, open `Help` > `Show Log...` will open the IDE log file. 

![JetBrains Debug Show Log](/assets/img/jetbrains-show-log.webp)

### Downloading Plugin Logs

AppMap technical support may ask you for your IDE logs to diagnose issues with the plugin's behavior. If so, go to the `Help` menu in your editor and select `Collect Logs and Diagnostic Data`. This will create a `.zip` file on your local machine and open a file explorer window to it. You can then safely send that file to AppMap within your technical support ticket conversation.

## GitHub Repository

[https://github.com/getappmap/appmap-intellij-plugin](https://github.com/getappmap/appmap-intellij-plugin)
