---
layout: docs
toc: true
title: Docs - AppMap overview
redirect_from: [/docs, /docs/faq]

---
# AppMap overview

AppMap is an open-source runtime code analysis tool.

AppMap records code execution traces, collecting information about how your code works and what it does. Then it presents this information as interactive diagrams that you can search and navigate. In the diagrams, you can see exactly how functions, web services, data stores, security, I/O, and dependent services all work together when application code runs.

You use AppMaps right in your code editor, using an AppMap extension or plugin. AppMaps also link directly to code, so you can use the information in the diagrams to make immediate code changes and improvements.

Over 85,000 software developers are using the [AppMap extension for VSCode](https://marketplace.visualstudio.com/items?itemName=appland.appmap) and the [AppMap plugin for JetBrains](https://plugins.jetbrains.com/plugin/16701-appmap).

<a class="btn btn-primary btn-lg" href="https://getappmap.com/">Get Started with AppMap</a>

![Getting started screenshot](/assets/img/docs/dependency-map-example.webp)
_AppMap dependency map in Visual Studio Code_

## What kind of code does it work with?

AppMap works best with web application and API frameworks, such as Rails, Django, Flask, Express, and Spring. That's because AppMap has specialized features for mapping web services, routing, view templates, HTTP client requests, caching, authentication, and SQL. You can map any kind of project that's written in a supported language, but it's when you map a database-backed web application or API service that you'll see the full power of AppMap.

AppMap works equally well with small and large projects - monoliths and microservices. And by large, we mean large. AppMap has been used successfully on code bases with 10 million lines of code. For a project that large, AppMap is a truly game-changing way to understand what the code is doing, from the front-end templates and web services, through the classes and functions, through SQL and HTTP client requests, and back.

{% include docs/app_framework_logos.html %}

## What can I use it for?

**Help new developers get oriented by creating a library of key AppMaps**

If you're an expert on a code base, you can create AppMaps that will help other developers to learn how the code works, ramp up quickly, and contribute. Start collecting AppMaps of key flows into a project Wiki or README. Then, when you get questions about the code base, you can direct developers there to get "self-service" code onboarding help from AppMaps.

**Use AppMaps to add context to bug reports and other code issues**

If you find a bug or security flaw, you can record an AppMap and attach it to the code issue/ticket. The AppMap will be a massive help to the developer who takes on the task of finding and fixing the bug. Developers, security testers, and QA people can all help make bug fixing easier by recording and submitting AppMaps to the dev team.


**Use AppMaps to learn new-to-you code**

If you're new to a code base, you can ask a code expert to provide you with some AppMaps that will orient you to the work you've been asked to do. The code expert can direct you to a Wiki or README that has AppMaps of key flows. Or, the code expert can make you a custom AppMap - and then you can return the favor by contributing the AppMap to the project Wiki or README, along with some of your own thoughts about how to use it.

## Features

* **Code execution recording** AppMap agent libraries record executing code and save the data as JSON files. Running test cases is the most common way to record AppMaps, but it’s not the only way. You can find additional examples of how to record AppMaps in the [Recording AppMaps](/docs/recording-methods.html) documentation.
* **Interactive diagrams** Sequence Diagrams, Flame Graphs, and Dependency maps are created automatically, showing how the modules and packages in your code relate to each other for a specific AppMap. A Trace diagram shows the code execution tree, including web services, functions, SQL queries, parameter values, status codes, etc. Learn more about [AppMap Diagrams](/docs/diagrams).
* **SQL query data** AppMap records all SQL queries that your application makes. Whether a query is listed explicitly in the code, or automatically generated by an object-relational mapping (ORM) library, you can see exactly what’s happening between your code and the database. Learn more about [How to use SQL in AppMaps](/docs/diagrams/how-to-use-appmaps.html#how-to-read-sql-code-in-appmaps) 
* **Web services data** AppMap records all HTTP server requests that are handled by your application. The AppMap includes the request method, path, headers, parameters, and status code, so you can see exactly what message your application received, and how it responded. AppMap captures so much information about HTTP server requests that it can automatically generate a complete OpenAPI (aka Swagger) file for your application. Learn more about [generating the OpenAPI description file](/docs/openapi).
* **Code labels** You can apply labels to the most important functions in your code. You can quickly identify and locate the most important functions in each code path by searching for labels in AppMap Diagrams. Labels are maintained right in the code base using annotations (Java and Python) or code comments (Ruby). Because labels are in the code, all developers can collaborate on labeling, and the code is always the source of truth for labels.
* **Open source** AppMap agent libraries and UI code are all available as MIT License open source. Learn about [Open Source contributions and our community](/docs/community.html).

