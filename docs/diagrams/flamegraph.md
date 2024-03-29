---
layout: docs
title: Docs - Diagrams
description: "Explore AppMap's Flame Graphs, a tool for visualizing code performance. Learn how to read, drill down, and switch views to identify performance issues."
diagrams: true
name: Flame Graph
step: 5
---

# Flame Graph

- [How to read a Flame Graph](#how-to-read-a-flame-graph)
- [Drilling Down](#drilling-down)
- [Switching to Other Views](#switching-to-other-views)
- [Identifying Performance Issues](#identifying-performance-issues)
  - [Expensive functions and queries](#expensive-functions-and-queries)
  - [N+1 Queries](#n1-queries)
  - [Delays from external service calls](#delays-from-external-service-calls)

Flame Graphs visualize the performance of your application’s code. A Flame Graph shows the time spent in each part of your application’s call stack, where the width of the event is proportional to how long it takes to execute.

Flame Graphs make it easy to see how much time is spent in each function, and which calls are the most expensive.

![flame graph image](/assets/img/docs/flamegraph-5.webp)

## How to read a Flame Graph

The lowest layer in a Flame Graph represents the AppMap, and it contains the map’s name. For AppMaps created from tests, this will usually be the same name as the test from which it was generated. In the example below, the AppMap was recorded from a test related to an application’s account activation capability.

![flame graph image](/assets/img/docs/flamegraph-8.webp)

Events in a Flame Graph are ordered bottom-up for functions calling other functions, and left-to-right for subsequent calls. To illustrate, the events in the map below are numbered according to the sequence in which they occurred.

![flame graph image](/assets/img/docs/flamegraph-9.png)

Cells in the flame graph are colored similarly to how they appear in the other AppMap views like the Dependency Map and Sequence Diagram. Blue represents classes, purple represents database queries, and yellow represents outgoing calls to other services. The lowest level of the Flame Graph, the map name, is colored teal.

Each event cell also shows the elapsed time spent executing it. This may be displayed in ms (milliseconds) or µ (microseconds). 

![flame graph image](/assets/img/docs/flamegraph-4.png)

Timing data and event names may not always fit on small cells. These can be revealed by hovering your mouse pointer over the cell.

## Drilling Down

It can be useful to zoom into particular parts of the call stack to examine the performance of certain functions more closely. Clicking on any event will expand it to the full width, allowing you to more clearly see the functions which it called.

<div class="video-container">
  <video playsinline loop autoplay muted>
    <source src="/assets/img/docs/flamegraph-6.mp4" type="video/mp4">
  </video>
</div>

You can also drill deeper into the Flame Graph using the zoom control on the right by clicking on the `+` and `-` controls, or by dragging the zoom bar. You can also zoom using your mouse wheel, and the graph will zoom towards the position of your mouse pointer.

<div class="video-container">
  <video playsinline loop autoplay muted>
    <source src="/assets/img/docs/flamegraph-2.mp4" type="video/mp4">
  </video>
</div>

AppMap filter settings also apply to Flame Graphs. For example, if you decide to hide calls to certain types of events (for example, by excluding calls to a logging package) those events will not appear in the Flame Graph. 

## Switching to Other Views

While investigating an event in an application, you can also view the same event in the Sequence Diagram and Trace View diagrams. Click on the event in question, and then select either “Show in Sequence” or “Show in Trace”.

Similarly, you can select an event in a Sequence Diagram or Trace View and click “Show in Flame Graph” to see it displayed in a Flame Graph diagram.

![flame graph image](/assets/img/docs/flamegraph-7.gif)

## Identifying Performance Issues

Certain performance problems can be visually easier to spot with a Flame Graph.

#### Expensive functions and queries

Expensive functions are those that are slow due to them doing a lot of computation and not spending much time waiting on other functions to return. In the example graph shown below, the function at the bottom of the stack is spending most of its 15.1 milliseconds of time waiting for the functions and queries which it called to return. The most expensive area in this stack is therefore the SQL `SELECT` query at the top which takes 10.3 milliseconds. That query should likely be the focus of any performance optimization effort over the other functions and queries.

![flame graph image](/assets/img/docs/flamegraph-expensive.png)

#### N+1 Queries

AppMap Analysis automatically detects [N+1 queries](/docs/reference/analysis-rules#n-plus-one-query), which are identical database queries called by the same parent function. In the example graph below, 60 repeated queries are visible at the top of the call stack.

![flame graph image](/assets/img/docs/flamegraph-1.gif)

#### Delays from external service calls

Performance problems can sometimes be caused by latency in external services. In the example graph below, the event in yellow represents a call to another service using HTTP. The call took 936 milliseconds to return, and only a few milliseconds more for the calling function to deal with that. Any optimization efforts for this area should therefore be spent in that other application, preferably by generating an AppMap for its `/users` API.

![flame graph image](/assets/img/docs/flamegraph-external-svc.png)
