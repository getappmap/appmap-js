---
layout: docs
title: Docs - Guides
description: "Use AppMap to auto generate OpenAPI definitions and document HTTP APIs. AppMap captures runtime behavior, creating accurate API schemas effortlessly."
guides: true
name: Generating OpenAPI Definitions
step: 7
redirect_from: [/docs/openapi,/docs/openapi/features,/docs/openapi/code-editor-extensions,/docs/openapi/integrations,/docs/openapi/customization,/docs/reference/openapi]
---


# Generating OpenAPI Definitions <!-- omit in toc -->

> "The OpenAPI specification, which is formerly known as Swagger Specification, is a community-driven open standard, programming language-agnostic interface description for HTTP APIs. This allows both humans and computers to discover and understand the capabilities of a service without requiring access to the source code."

Because AppMap records your code's runtime behavior, it can see and record all of the HTTP API calls processed including the schema of each request and response. Creating OpenAPI definitions by hand is error prone and time consuming. Keeping them up to date is additional work that quickly falls out of sync with the code. Using the AppMap we can automatically output OpenAPI definitions for an application. 

- [Requirements](#requirements)
- [Schema](#schema)
- [Use Cases](#use-cases)
  - [Pull Request Review](#pull-request-review)
  - [Update Documentation Automatically](#update-documentation-automatically)
  - [Send to 3rd Party Services](#send-to-3rd-party-services)
- [Generating definitions](#generating-definitions)
- [Integrations](#integrations)
- [Customization](#customization)
  - [Operation `summary`](#operation-summary)

## Requirements

1. AppMap Data generated from your application that includes calls to your API endpoints. (Refer to the AppMap documentation on [how to record your application](/docs/recording-methods))
2. The latest version of the [AppMap binaries downloaded.](https://github.com/getappmap/appmap-js/releases?q=@appland/appmap*&expanded=true) (For the CLI usage)
3. The latest version of the AppMap code editor extension (for code editor usage)  

## Schema

The generated OpenAPI schema only includes information (paths, methods, status codes, parameters, responses, headers, security) that have actually been observed in the AppMap Data. So, if a particular code behavior has not been observed by AppMap, it won't be present in the OpenAPI. 

When AppMap Data is collected by running test cases, the generated OpenAPI will reflect the code coverage of the application with regard to its APIs. If an expected path, method, status or parameter is not observed in the generated OpenAPI, you'll know it's missing because it's not tested.

Object schema is inferred from runtime data. When there are many examples of a request, the inferred schema of all the examples is merged into one unified schema. 

Both request and response schema are available.

## Use Cases

### Pull Request Review

We suggest you generate OpenAPI for all new work, and commit the _openapi.yaml_ file to source control. When a pull request contains API changes, a diff view of the OpenAPI changes is a very useful way for code reviewers to quickly get the "big picture" of the new branch.

### Update Documentation Automatically

By generating OpenAPI definitions as part of your continuous integration process, you can ensure that your documentation continually updates automatically as the code updates. This reduces unnecessary engineering toil working to keep documentation up to date manually. 

### Send to 3rd Party Services

Integrate AppMap OpenAPI generation with various 3rd party services to share OpenAPI documentation with your end users or validate and diff changes over time.  [Refer to the documentation](/docs/integrations/) to learn how to incorporate AppMap OpenAPI generation with various 3rd party services.

## Generating definitions

* [AppMap extension for VSCode](/docs/reference/vscode.html#generate-openapi-definitions)
* [AppMap extension for JetBrains](/docs/reference/jetbrains.html#generate-openapi-definitions)
* [AppMap CLI](/docs/reference/appmap-client-cli.html#openapi)

## Integrations

Refer to the AppMap [integrations documentation](/docs/integrations/) to learn more about how to integrate your OpenAPI documentation with other 3rd party software and services. 

## Customization

### Operation `summary`

To populate [`operation.summary`](https://swagger.io/specification/#operation-object), set the header `X-OpenAPI-Summary` in your response.

**Example**

_Ruby on Rails Controller_

```
class AccountActivationsController < ApplicationController
  def edit
    response.headers['X-OpenAPI-Summary'] = 'Activate the account of an existing user'
```

_openapi.yaml_

```
/account_activations/{id}/edit:
    get:
      responses:
        '302':
          content: {}
          description: Found
      parameters:
        - name: email
          in: query
          schema:
            type: string
        - name: id
          in: path
          schema:
            type: string
          required: true
      summary: Activate the account of an existing user
```
