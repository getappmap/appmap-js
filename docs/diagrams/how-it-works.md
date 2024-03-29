---
layout: docs
title: Docs - Diagrams
description: "AppMap visualizes code behavior in interactive diagrams. Features include recording dynamic runtime code with AppMap, quick search in navigation, filtering, detailed stats, and sequence diagram control."
diagrams: true
name: How it works
step: 1
redirect_from: [/docs/how-to-use-appmap-diagrams.html, /docs/how-to-use-appmap-diagrams, /docs/diagrams/how-to-use-appmaps]
---

# How it works

AppMap records the behavior of running code into JSON files, and visualizes them in interactive diagrams right in your code editor.

{% include docs/how_it_works_illo.html %}

## AppMap agent records executing code as JSON files
Once your app is instrumented, the AppMap agent creates JSON files as you execute test cases, run sample programs, or perform interactive sessions with your app.

AppMap files can be most conveniently recorded from automated tests, but other methods of recording are preferred in certain situations, such as direct recording of code blocks or remote recording controlled with REST endpoints. [Learn more about Recording AppMaps](/docs/recording-methods).

## Quick search for HTTP routes, packages, classes, and functions in the left-hand navigation bar

Use the navigation bar for quick navigation to items of interest, for example, HTTP routes, labels, packages, classes, functions.

<div class="video-container">
  <video playsinline loop autoplay muted>
    <source src="/assets/img/docs/navigate-to-interest.mp4" type="video/mp4">
  </video>
</div>

## Use the filtering icon to reduce the number of objects in the AppMap view 

Filter out items such as unlabeled code, specific classes or packages, external code, and more. 

<div class="video-container">
  <video playsinline loop autoplay muted>
    <source src="/assets/img/docs/filter-appmaps.mp4" type="video/mp4">
  </video>
</div>

## Show more detailed statistics about your AppMap 

Includes the frequency of specific function calls and the size represented within the AppMap.  This is helpful when [handling large AppMaps](https://appmap.io/docs/guides/handling-large-appmaps.html) and to reduce their size. 

<img src="/assets/img/docs/appmap-stats.webp"/>

## Expand and Collapse the Depth of Sequence Diagrams

This will hide or show all actions that are deeper in the call stack than the selected value, and will result in a more compact diagram. Actions can be expanded or collapsed with the `+` or `-` controls to change the depth of the calls shown within your sequence diagram.  

<div class="video-container">
  <video playsinline loop autoplay muted>
    <source src="/assets/img/docs/sequence-diagram-expand.mp4" type="video/mp4">
  </video>
</div>

## Demo of using AppMaps
This video demonstrates how to use AppMap Diagrams when learning how unfamiliar code works:

<div style="position: relative; padding-bottom: 56.25%; height: 0;"><iframe src="https://www.loom.com/embed/de75ba638d57418da2d42417936cdf95" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>