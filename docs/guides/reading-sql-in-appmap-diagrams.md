---
layout: docs
title: Docs - Guides
description: "Discover SQL commands in AppMap Diagrams to analyze application logic's database interactions, spot inefficiencies, and understand code impacts for improved performance and reliability."
guides: true
name: Reading SQL in AppMap Diagrams
step: 5
redirect_from: [/docs/guides/reading-sql-in-appmaps]
---

## Reading SQL in AppMap Diagrams
The AppMap extension for your editor displays SQL commands in AppMap Diagrams so you can understand how your application logic interacts with the database. You can quickly discover SQL inefficiencies and anti-patterns that pose hidden scalability and reliability risks even if your application seems to be working well.

With the AppMap extension, not only are trips to database logs no longer required to see the SQL commands, but the SQL commands are also directly linked to the code that initiates their execution, helping developers understand the direct impacts of their code updates on database operations and performance.   

### View all SQL commands, pick a command of interest, and drill down to details
When you open an AppMap, the navigation bar lists all captured SQL commands. This is a great starting point for your SQL investigation: 
- Browse the list of SQL commands, pick a command, and click on it to drill down to details
- View the SQL command in the Trace to see how it is connected to upstream/downstream code and other SQL commands
- Click on the Caller link to see the function call that initiated the command’s execution.

<div class="video-container">
  <video playsinline loop autoplay muted>
    <source src="/assets/img/docs/view-all-sql-commands.mp4" type="video/mp4">
  </video>
</div>

### Search for specific SQL commands/tables/columns
Use the search box in the Navigation bar to select for a specific subset of SQL Commands: 
- Search for a specific SQL command such as SELECT, UPDATE, INSERT, etc.
- Search for a table or column name
- Use regular expressions for complex searches, filtering the results by multiple criteria, for example, `SELECT.*_orders.*`

<div class="video-container">
  <video playsinline loop autoplay muted>
    <source src="/assets/img/docs/search-for-specific-sql-commands.mp4" type="video/mp4">
  </video>
</div>

### View SQL commands executed by a specific class or package
When you click on a dependency link in the Dependency Map, the navigation bar will list events specific to that relationship. 
- Select a link between the database icon and a class to see SQL commands executed by functions of that class
- Click on a SQL command to drill down to details.

<div class="video-container">
  <video playsinline loop autoplay muted>
    <source src="/assets/img/docs/view-specific-sql-executed-by-class.mp4" type="video/mp4">
  </video>
</div>

### Spot complex SQL patterns
When investigating how efficiently the application code or the ORM utilizes the database, it’s helpful to see whether multiple SQL commands are clustered together and whether they form any specific (anti-)patterns. The Trace view is a great visual tool for spotting clusters and repetitions of SQL commands enveloped by code that are difficult to discover using database logs or other simple tools.
- In the AppMap, switch to the Trace view
- Start with any of the SQL commands in the navigation bar and investigate how they are connected with other SQL commands or code blocks
- When looking for N+1-like patterns, look for repetitive SQL `SELECT`s fetching single records using a specific ID
- Use the zoom controls, arrow keys, panning, and expand/collapse functions to navigate around the trace efficiently.

#### Navigate the trace efficiently
<div class="video-container">
  <video playsinline loop autoplay muted>
    <source src="/assets/img/docs/navigate-the-trace-efficiently.mp4" type="video/mp4">
  </video>
</div>


### Example: How to spot and fix Django ORM anti-patterns
In this video example, you can learn how to optimize Django ORM by seeing how it makes SQL queries under the hood. The video explains the role of ORM in modern applications, SQL efficiency challenges, and how to use AppMap for uncovering and fixing the infamous N+1 anti-pattern

<div style="position: relative; padding-bottom: 56.25%; height: 0;"><iframe src="https://www.loom.com/embed/3872950e96174da4a714211b2af7f56e" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>
