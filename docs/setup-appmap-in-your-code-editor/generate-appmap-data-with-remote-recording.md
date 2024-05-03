---
layout: docs
title: Docs - AppMap in your Code Editor
description: "Generate AppMap Data through remote recording for detailed HTTP request sequences. Install AppMap agent and follow steps for remote recording in various languages."
name: Generate AppMap Data with Remote Recording
step: 4
setup-appmap-ide: true
redirect_from: [/docs/your-first-15-minutes-with-appmap/generate-appmaps-with-remote-recording, /docs/setup-appmap-in-your-code-editor/generate-appmaps-with-remote-recording]
---

# Generate AppMap Data with Remote Recording

Remote recording enables you to create an AppMap while interacting directly with your app through the UI or API.

Some benefits of remote recording include:

* **Named by you** When you finish creating a remote recording, you give it a name that makes sense to you. For example, you can name it for the user flow, or the ID number of the issue that you are trying to reproduce.
* **Contains a sequence of requests** A remote recording AppMap contains the entire sequence of HTTP server requests that occur as you use the application.
* **Contains both foreground and background work** A remote recording AppMap contains all threads of execution, not just the web server. So you can see background jobs, message queue activity, and other threads of activity along with the main HTTP server request.
* **Ideal for sharing** When you reproduce a bug, security vulnerability, or performance problem in a remote recording AppMap, you can share it with colleagues so they can see exactly what the problem is. An AppMap contains much more information than the source code itself.

The steps for creating a remote recording are:

1. Start your application server with remote recording enabled:

   * [Remote recording - Ruby](/docs/reference/appmap-ruby#remote-recording)
   * [Remote recording - Python](/docs/reference/appmap-python#remote-recording)
   * [Remote recording - Java (IntelliJ)](/docs/reference/jetbrains#running-a-java-application-with-appmap)
   * [Remote recording - Java (VS Code)](/docs/reference/vscode#remote-recording)
   * [Remote recording - Java (command line)](/docs/reference/appmap-java#remote-recording)
   * [Remote recording - Node.js](/docs/reference/appmap-node#remote-recording)

{% include vimeo.html id='916087968' %}

---

**In this video**  
We generate AppMap Data with a remote recording of our application. You can remote record your application if your app doesn’t have complete test cases, or when you want to dive into a specific user interaction such as an API call or specific product functionality in your app.

**Links mentioned**  
[Rails Sample Application](https://github.com/land-of-apps/sample_app_6th_ed/tree/codespaces-devcontainer)  
[Early Access to AppMap Analysis](/appmap-analysis)  
[Detailed Remote Recording instructions for Rails](/docs/reference/appmap-ruby.html#remote-recording)  
[Detailed Remote Recording instructions for Java](/docs/reference/appmap-java.html#remote-recording)

---

## Follow along

In this tutorial we are going to generate AppMap Data with a remote recording of our application. You can remote record your application if your app doesn’t have complete test cases, or when you want to dive into a specific user interaction such as an API call or specific product functionality in your app.

We are going to be using [a sample ruby on rails application](https://github.com/land-of-apps/sample_app_6th_ed/tree/codespaces-devcontainer), which is a basic Twitter clone. If you have followed the previous tutorials, you’ll have [AppMap installed, and have already generated AppMap Data for your test cases](/docs/setup-appmap-in-your-code-editor/generate-appmap-data-from-tests).

## Install AppMap agent

**NOTE:** If you're using JetBrains IntelliJ IDEA with Java, [follow these instructions](/docs/reference/jetbrains#remote-recording) to create AppMap Data using remote recording.

We’re going to open the AppMap for Visual Studio Code extension and install the AppMap agent. Our installer will confirm that the project meets all the requirements necessary to create maps.

<img class="video-screenshot" src="/assets/img/appmap-install.webp"/>

We’ll run the AppMap installer, select `bundler`, since this is a Ruby on Rails project.

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/select-bundler.webp"/>

You’ll see that the only changes thus far to our repository are the addition of an AppMap configuration file and the AppMap gem being added as a development dependency.

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/project-config-diff.webp"/>

## Recording AppMap Diagrams

Next, follow the on-screen instructions for recording AppMap Data. You'll receive one of the two following options.

First, you may be instructed to run your application as you normally would. In this scenario, AppMap will automatically be enabled and each web request will generate a new AppMap.

If you see this screen, follow along with [request recording AppMap Data](/docs/setup-appmap-in-your-code-editor/generate-appmap-data-with-request-recording).

<img class="video-screenshot" src="/assets/img/appmap-record.webp"/>

Otherwise, you'll be given a command to copy and paste into the terminal which will guide you through running your application with AppMap enabled.

`npx @appland/appmap record`

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/record-command.webp"/>

Before I run that command, I’m going to want to start my application locally and make sure I can connect to it. I’m going to open another terminal window and run:

`bundle exec rails server`

If you are remote recording a Java application or other language, please refer to the [AppMap documentation](/docs/recording-methods.html) for the relevant tutorials for those languages. With my app now running you can see that I can login to my app, navigate around, post a tweet, see users.

We’ll now return to our console and run the `record` command. If I omit passing any options, I’ll be prompted to choose how to record the app. I’ll choose remote recording. AppMap will try to locate your running application locally, if your app is running in a container or elsewhere you may get an error. Simply follow the instructions to walk through the available configuration options to connect to your service.

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/select-remote-recording.webp"/>

## Interact with Application

Now that the agent is connected, we can hit enter to begin recording. Now, I can interact with my application, kick off a specific functional or integration test, or make any specific API calls to your application. I’m going to login and reset my password. It’s important to keep remote recordings focused on a specific function, and not include too many interactions in one single AppMap Data recording as they can grow large as recordings progress.

When I am done interacting, I return back to the terminal and hit enter again to stop the recording. We’ll give this recording a name and then this AppMap will be opened within VS Code.

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/stop-remote-recording.webp"/>

## Open AppMap Diagrams

We’ll also receive a runtime analysis scan of this code path as well, which has identified a performance issue with an N+1 SQL query generating the main list of tweets. For early access to our AppMap runtime analysis [reach out to us](/appmap-analysis).

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/remote-recorded-appmap.webp"/>

Finally, you'll see AppMap Data actually exists inside your temp directory in the AppMap folder. We don't recommend committing these to your project. They can grow your git repositories unnecessarily. But you can commit changes to your Gemfile and the appmap configuration file which will make the project available to other developers.

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/dont-commit-appmaps.webp"/>
