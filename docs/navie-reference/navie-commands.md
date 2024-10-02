---
layout: docs
title: Docs - AppMap Navie
description: "Reference Guide to AppMap Navie AI, a complete list of the available commands in AppMap Navie AI."
name: Navie Commands
navie-reference: true
toc: true
step: 3
---

# Navie Commands

You can ask free-form questions, or start your question with one of these commands:

- [`@plan`](#plan)
- [`@generate`](#generate)
- [`@test`](#test)
- [`@explain`](#explain)
- [`@diagram`](#diagram)
- [`@help`](#help)

## @plan

The `@plan` command prefix within Navie focuses the AI response on building a detailed implementation plan for the relevant query.  This will focus Navie on only understanding the problem and the application to generate a step-by-step plan. This will generally not respond with code implementation details, consider using the `@generate` command which can implement code based on the plan.

#### Examples <!-- omit in toc -->

- @plan improve the performance of my slow product listing page.  
- @plan implement a cache key for my user posting on my social media application.  
- @plan migrate the /users/setting API endpoint from SQL to MongoDB.  

#### `@plan` Video Demo <!-- omit in toc -->

{% include vimeo.html id='985121150' %}

## @generate

The `@generate` prefix will focus the Navie AI response to optimize for new code creation.  This is useful when you want the Navie AI to respond with code implementations across your entire code base. This will reduce the amount of code explanation and generally the AI will respond only with the specific files and functions that need to be changed in order to implement a specific plan.

#### Examples <!-- omit in toc -->

- @generate Using the django-simple-captcha library add the necessary code for an offline captcha to my new user registration page.
- @generate Update the function for the physical flow export to include data type via physical_spec_data_type and physical_specification tables without changing the existing functionality.
- @generate Design and implement a cache key for user posts and show me how to implement it within this code base

#### `@generate` Video Demo <!-- omit in toc -->

{% include vimeo.html id='985121150' %}

## @test

The `@test` command prefix will focus the Navie AI response to optimize for test case creation, such as unit testing or integration testing.  This prefix will understand how your tests are currently written and provide updated tests based on features or code that is provided.  You can use this command along with the `@generate` command to create tests cases for newly generated code.

#### Examples <!-- omit in toc -->

- @test create integration test cases for the user setting page that is migrated to mongodb.  
- @test create unit and integration tests that fully support the updated cache key functionality.  
- @test provide detailed test cases examples for testing the updated user billing settings dashboard.  

## @explain

The `@explain` command prefix within Navie serves as a default option focused on helping you learn more about your project. Using the `@explain` prefix will focus the Navie AI response to be more explanatory and will dive into architectural level questions across your entire code base. You can also use this to ask for ways to improve the performance of a feature as well. 

#### Examples <!-- omit in toc -->

- @explain how does user authentication work in this project?
- @explain how is the export request for physical flows handled, and what are the tables involved?
- @explain how does the products listing page works and how can I improve the performance?

## @diagram

The `@diagram` command prefix within Navie focuses the AI response to generate Mermaid compatible diagrams.  [Mermaid](https://mermaid.js.org/) is an open source diagramming and charting utility with wide support across tools such as GitHub, Atlassian, and more.  Use the `@diagram` command, and Navie will create and render a Mermaid compatible diagram within the Navie chat window.  You can open this diagram in the [Mermaid Live Editor](https://mermaid.live), copy the Mermaid Definitions to your clipboard, save to disk, or expand a full window view.  Save the Mermaid diagram into any supported tool such as GitHub Issues, Atlassian Confluence, and more. 

#### Example Questions <!-- omit in toc -->

```
@diagram the functional steps involved when a new user registers for the service.
```
  
<img class="video-screenshot" src="/assets/img/product/sequence-diagram-navie.webp"/> 
 
```
@diagram the entity relationships between products and other important data objects.
```

<img class="video-screenshot" src="/assets/img/product/entity-relationship-navie.webp"/> 

```
@diagram using a flow chart how product sales tax is calculated.
```

<img class="video-screenshot" src="/assets/img/product/flow-chart-navie.webp"/> 

```
@diagram create a detailed class map of the users, stores, products and other associated classes used
```

<img class="video-screenshot" src="/assets/img/product/class-map-navie.webp"/> 

#### Example Diagram Projects <!-- omit in toc -->

Below are a series of open source projects you can use to try out the `@diagram` feature using 
prebuilt AppMap data in a sample project. Simply clone one of the following projects, open 
into your code editor with the AppMap extension installed, and ask Navie to generate diagrams.

- [Sample Python Project](https://github.com/land-of-apps/python-diagram-example/blob/master/README.md)
- [Sample Ruby Project](https://github.com/land-of-apps/rails-diagram-example/blob/main/README.md)
- [Sample Node (MERN) Project](https://github.com/land-of-apps/mern-diagram-example/blob/master/README.md)
- [Sample Java Spring Project](https://github.com/land-of-apps/waltz/blob/demo/diagram-examples/demo/diagram-demo.md)

## @help

Navie will help you setup AppMap, including generating AppMap recordings and diagrams.  This prefix will focus the Navie AI response to be more specific towards help with using AppMap products and features.  This will leverage the [AppMap documentation](https://appmap.io/docs) as part of the context related to your question and provide guidance for using AppMap features or diving into advanced AppMap topics. 

#### Examples <!-- omit in toc -->

- @help how do I setup process recording for my node.js project?
- @help how can I reduce the size of my large AppMap Data recordings?
- @help how can i export my AppMap data to atlassian confluence? 
