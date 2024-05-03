---
layout: docs
title: Docs - Reference
description: "Explore AppMap features in Visual Studio Code: AppMap panel, runtime analysis, code objects, Java integration, extension actions, remote recording, OpenAPI generation."
toc: true
reference: true
name: AppMap for Visual Studio Code
step: 1
---

# AppMap for Visual Studio Code

- [AppMap panel](#appmap-panel)
  - [Instructions](#instructions)
  - [AppMap Diagram tree view](#appmap-diagram-tree-view)
  - [Runtime Analysis](#runtime-analysis)
  - [Code Objects](#code-objects)
- ["Run with AppMap" for Java](#run-with-appmap-for-java)
- [Extension actions](#extension-actions)
- [Remote recording](#remote-recording)
- [Generate OpenAPI Definitions](#generate-openapi-definitions)
- [GitHub repository](#github-repository)

## AppMap panel

### Instructions

Step-by-step instructions for configuring a project to use AppMap and using the main features.

Once you've configured AppMap for a project, commit the file changes to Git so that your colleagues don't have to do the setup themselves.

### AppMap Diagram tree view

The AppMap view shows all AppMap Diagrams in your open projects. You can open it from the top level menu (View -> Open view... -> AppMap), with an AppMap action or by clicking on its icon in the side bar.

AppMap Diagrams are organized by how they were created (request recording, remote recording, test case recording).

Within the AppMap tree view you can

* Click on any AppMap name to open the diagram
* Right-click for a context menu

You can also use the tree view buttons to Filter the AppMap tree by name, or search for a specific AppMap. There are also extension commands to do this.

### Runtime Analysis

AppMap can find automatically find software design flaws that impact security, performance, stability, and maintainability. When a problem is found, it's listed here. Click on the problem to get detailed information about it.

### Code Objects

All the HTTP server requests, SQL queries, packages, classes, and functions that are present in an AppMap are listed here in a tree view. You can navigate through these code objects to see what's present in your project. Click on any code object to open the AppMap Diagram that contains it.

## "Run with AppMap" for Java

**NOTE:** This section only applies to Java applications.

Installing the AppMap VC Code plugin adds a default [Launch Configuration](https://code.visualstudio.com/docs/editor/debugging) which supports the integrated VS Code debugger. These can be used to run your Java application code with AppMap automatically configured, saving you from manually changing your Maven or Gradle settings. This is the recommended approach for all Java users using the VS Code editor.

To run your tests with AppMap enabled, navigate to the `Testing` section of VS Code in the left hand menu icons. If your project has tests you will see them listed in the following screen. From here, click on the `Run Tests` icon, highlighted in the screenshot below. This will kick off your test cases with the AppMap libraries installed and enabled. 

<img class="video-screenshot" src="/assets/img/vscode-run-with-tests.webp"/> 

To run your application with AppMap enabled, navigate to the `Run and Debug` section of VS Code in the left hand menu icons. You will see a new launch configuration in the in the drop down which says `Run with AppMap` alongside any other launch configurations for your project.  With the `Run with AppMap` launch configuration select click on the "Play" icon, highlighted in the screenshot below. This will start your application with the AppMap libraries installed and enabled.  You can now interact with your application to generate [request recordings](/docs/reference/appmap-java.html#requests-recording) or use [remote recording](#remote-recording).

<img class="video-screenshot" src="/assets/img/vscode-run-with-appmap.webp"/> 

After installing the VS Code AppMap extension for your Java project, you will notice a new launch configuration in the `.vscode` directory in your project. 

<img class="video-screenshot" src="/assets/img/docs/vscode-launch-configuration.webp"/> 

Next, click on the "Run and Debug" menu option in the left hand column of VS Code

<img class="video-screenshot" src="/assets/img/docs/vscode-run-and-debug.png"/> 

Clicking on the "Play" button next to the "Run with AppMap" launch configuration will start your Java application with the necessary AppMap configuration flags enabled by default. 

When your application is running you can proceed to record AppMap Data using either [Requests Recording](/docs/reference/appmap-java#requests-recording) or [Remote Recording](https://appmap.io/docs/reference/vscode.html#remote-recording)


## Extension actions

To open the list of AppMap extension actions, press `CTRL+SHIFT+P` or `COMMAND+SHIFT+P` on macOS and type `AppMap`. 

Most of the command names should be self-explanatory. Here are a few commands which are a bit more complicated:

- **AppMap: Filter/Find AppMap by name** Opens the AppMap side bar view and the filter/find text field
- **AppMap: Login**, **AppMap: Logout** Some extension functionality requires you to login to the AppMap Server. You'll be prompted to do this when you setup AppMap for the first time. You can also login and logout using the built-in `Accounts` feature of VSCode.
- **AppMap: Touch Out-of-Date Test Files** If you have AppMap Diagrams generated from test cases, this command will determine which tests need to be re-run in order to bring the AppMap Data up-to-date. It will then "touch" (update the modified date) of each out-of-date test case. You can use a file watching trigger program like `Guard` (Ruby), `grunt` or `gulp` (JS) to re-run the test cases as they are touched.
- **AppMap: Copy Out-of-Date Tests to Clipboard** Similar to the "Touch Out-of-Date Test Files" command, but places the file names on the clipboard
- **AppMap: Open Code Object in AppMap** Using this command you can find and open AppMap Diagrams for any code object (package, class, function, route, etc) in your project.

## Remote recording

You can make a [remote recording](../recording-methods#remote-recording) from within the VSCode IDE. First, start your application with remote recording enabled. Exactly how to do this depends the language you're using - consult the [agent reference](/docs/reference) for details.

To start a recording, click the remote recording button, or use the command **AppMap: Start a Remote Recording**.

![Start remote recording](/assets/img/docs/vscode-remote-start.png)

Interact with your app through its UI or API. Then use the stop remote recording button again, or use the command **AppMap: Stop the Remote Recording**. 

![Stop remote recording](/assets/img/docs/vscode-remote-stop.png)

You'll be prompted to save the AppMap to a file, and it will be opened.

![Prompt remote recording](/assets/img/docs/vscode-remote-save.png)

For more details about remote recording, see:

* [Recording methods > Remote recording](../recording-methods#remote-recording)
* [Remote recording API](../reference/remote-recording-api)

## Generate OpenAPI Definitions

After [recording AppMap Data](/docs/recording-methods.html) for your project, open the command pallette using `CTRL+SHIFT+P` or `COMMAND+SHIFT+P` on macOS, type `AppMap: Generate OpenAPI`, then hit `Enter`. This will open a new file with your OpenAPI definition document. Save this file locally, share with your team, or ingest as a [new collection into API tools like Postman.](https://blog.postman.com/new-postman-integration-with-appmap-create-and-manage-always-accurate-collections/)

![alt_text](/assets/img/openapi/openapi-1.webp "OpenAPI export to file")


## GitHub repository

[https://github.com/getappmap/vscode-appland](https://github.com/getappmap/vscode-appland)
