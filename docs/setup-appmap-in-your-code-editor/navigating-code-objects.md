---
layout: docs
title: Docs - AppMap in your Code Editor
description: "Explore AppMap's Code Objects view to navigate code functions, HTTP requests, and SQL queries across all AppMap Diagrams."
name: Navigating Code Objects
setup-appmap-ide: true
step: 7
redirect_from: [/docs/your-first-15-minutes-with-appmap/navigating-code-objects]
---

# Navigating Code Objects
{% include vimeo.html id='916048582' %}

---

**In this video**  
Dive into the Code objects view, a high level view of code functions,  HTTP requests, and SQL queries across the entire set of your AppMap Diagrams and learn how to locate and navigate to an AppMap from code reference pins on your code functions. 

**Links mentioned**  
[Rails Sample Application](https://github.com/land-of-apps/sample_app_6th_ed/tree/codespaces-devcontainer)

---
## Follow along

Welcome to AppMap, In this tutorial we will be diving into advanced navigation of AppMap Diagrams - the Code Objects view. We’ll answer the question, “What if I have a lot of AppMap Diagrams and I don’t know where exactly to look?” 

In this view, we collect all the different code functions and  HTTP server requests and SQL queries all into one list. Every request, query, and function call that occurs anywhere in the whole set of AppMap Diagrams will be in this list. 

## Code Objects View

There are three sections to the Code Objects view. The first section is the Code view, this will show packages, classes, and functions, it will show the framework code as well as my code, essentially everything present within your AppMap Diagrams. We can click on a function to navigate directly to the code. In this example, I’ll navigate to my Application controllers, and view the Microposts controller. This will take me directly to the code for this function. This is a great way to see more comprehensively what you have across your code base. 

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/code-objects-view.webp"/>

## HTTP Routes List

In the HTTP Service request list, you can see basically a mini spec file showing you what routes are available across all of your AppMap Diagrams. 

If this route only exists in a single AppMap, you’ll be taken directly to the AppMap for this request, but if the route exists in multiple diagrams you’ll get a VScode picker to choose which one to open. 

Here is this route, and here it is shown in a trace view, and you’ll see the status code for that is 302 which is a redirect.

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/code-objects-trace-view.webp"/>

## SQL Query List

The final section of Code Objects is a list of all the SQL queries across your AppMap Diagrams. Just like before, if you click into it and it is unique across your AppMap set then you’ll be sent directly to the AppMap or the quick picker will prompt you to open one. 

The code view is a handy way to navigate your code base, similar to the file view you’d get in VS Code except this code view will only show the code that participated in your test case recordings or remote recordings.

But it’s more common to simply be navigating within the code itself. So what if you want to get to the AppMap Diagram from within the code?

## Opening AppMap Diagrams from code object names

The command “Open code object in AppMap” can be used to find and open all the AppMap Diagrams that contain a particular code object (package, class, or function name).

<img class="video-screenshot" src="/assets/img/docs/first-fifteen-minutes/code-object-command-palette.webp"/>

To get here in VS Code open the command palette. 

On Mac:
`Shift + Command + P`

On Windows/Linux:
`Ctrl + Shift + P`

I can then search for the `UsersController#show` function - if it's in a single AppMap I’ll get taken directly to that AppMap. If it exists in more than one you’ll get the quick picker to choose which one you want.
