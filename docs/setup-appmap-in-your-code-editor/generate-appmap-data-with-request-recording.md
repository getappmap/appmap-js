---
layout: docs
title: Docs - AppMap in your Code Editor
description: "Learn to use AppMap to configure your app to record AppMap Data of HTTP requests, easily sort and name them."
name: Generate AppMap Data with Request Recording
setup-appmap-ide: true
redirect_from: [/docs/your-first-15-minutes-with-appmap/streaming-appmaps-with-request-recording, /docs/setup-appmap-in-your-code-editor/generate-appmaps-with-request-recording]
step: 5
---

# Generate AppMap Data with Request Recording

You can configure your application to record an AppMap of each HTTP server request.

Some characteristics of request recording include:

* **Named for the route** The name of each AppMap contains the HTTP request method and path, so you can see at a glance what request AppMap contains.
* **Sortable by timestamp** In the AppMap extension, AppMap Data recorded from requests are sorted by timestamp, with newest AppMap Diagrams at the top. So you can see a chronology of the requests that your app is serving.

For details on requests recording, see:

- [Requests recording - Ruby](/docs/reference/appmap-ruby#requests-recording)
- [Requests recording - Python](/docs/reference/appmap-python#requests-recording)
- [Requests recording - Java](/docs/reference/appmap-java#requests-recording)

{% include vimeo.html id='916048527' %}

---

**In this video**  
We enable automatic recording of a Ruby on Rails application and stream AppMap Data into VS Code for each request as we interact with our application. Now available for Ruby on Rails applications, you can generate AppMap Diagrams for each request automatically by simply running your application locally and interacting or making API requests.

**Links mentioned**  
[Requests Recording](/docs/recording-methods.html#requests-recording)  
[Requests Recording in Rails](/docs/reference/appmap-ruby#requests-recording)  
[Requests Recording in Python](/docs/reference/appmap-python#requests-recording)  

---

## Follow along

In this tutorial we are going to show you the latest way to generate AppMap Diagrams for your application, streaming AppMap Data for each request. 

This feature is currently available for [Ruby on Rails](/docs/reference/appmap-ruby#requests-recording), as well as [Python](/docs/reference/appmap-python#requests-recording) applications that use Django or Flask.

## Install AppMap agent

You can add AppMap to your project now by simply clicking the automated installer. This automatically adds the AppMap libraries to your project and will run your projects’ package manager such as Bundler, Pip, Poetry, and others. 

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/streaming-appmap-1.webp"/>

You could also skip the automated installer and add this to the top of your Gemfile in this Rails example. 

```
# This must be the first gem listed
gem 'appmap', group: %i[test development]
```

With AppMap installed in this project, we can now start recording. You can record AppMap Diagrams by running your test cases, or by starting a remote recording of a user interaction. But now you can simply just start your project and AppMap will automatically record every request as it happens. 

I will now start my rails application, this is our AppMap merch store based on the open source project Solidus. You will see AppMap is enabled by default for the development environment.  

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/streaming-appmap-2.webp"/>

I can now interact with my application and AppMap Data will start to stream into my code editor.  We’ll highlight HTTP server requests, SQL Queries, and highlight important AppMap Diagrams.

I can then open the AppMap Diagrams to see which packages and functions interact with my database for example. 

And of course, AppMap will be continually alerting on performance and security issues for this project with AppMap Analysis. 

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/streaming-appmap-3.webp"/>

With that we find an [authorization happening before authentication](/docs/reference/analysis-rules#authz-before-authn). This is the #1 security flaw on the OWASP Top Ten - and no other tool can detect it.

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/streaming-appmap-4.webp"/>

Head over to [the Get AppMap page](/get-appmap) to get started with our VS Code or JetBrains extension and add AppMap to your project today.  
