---
layout: docs
title: Docs - Integrations
description: "AppMap integration with SwaggerHub automates API documentation directly into SwaggerHub using GitHub Actions. Collaborate on API design, ensuring style, quality, and consistency."
integrations: true
name: SmartBear SwaggerHub
render_with_liquid: false
step: 5
---

# SmartBear SwaggerHub and Portal

[SwaggerHub](https://swagger.io/tools/swaggerhub/) is a centralized API design tool which allows teams to collaborate on API design and enforce style, quality, and consistency of their APIs. 

[SwaggerHub Portal](https://swagger.io/tools/swaggerhub/features/swaggerhub-portal/) let's you synchronize your API designs from SwaggerHub into a customized portal which creates comprehensive and easy to use API documentation for your users and customers.  

AppMap supports multiple use-cases when integrating AppMap and SwaggerHub.
- [Generate Code-First OpenAPI and Publish to SwaggerHub](#generate-code-first-openapi-and-publish-to-swaggerhub)
- [Disable Deployment when Runtime OpenAPI Diverges from SwaggerHub API](#disable-deployment-when-runtime-openapi-diverges-from-swaggerhub-api)
  
## Generate Code-First OpenAPI and Publish to SwaggerHub

AppMap supports the integration of it's automatic code-first OpenAPI documentation functionality directly into the SwaggerHub platform by leveraging the [SwaggerHub CLI](https://github.com/SmartBear/swaggerhub-cli) and GitHub Actions.  Using AppMap, you can automated interact with your API routes via a GitHub action, AppMap will automatically capture details about those API route interactions and export them into OpenAPI supported formats. From there, you can use the SwaggerHub CLI to push these APIs directly to SwaggerHub and Portal. 

### Configuration

First, access your API key on the [user settings page](https://app.swaggerhub.com/settings/apiKey) in SwaggerHub. When using GitHub Actions, you'll want to save this API key as a [action secret](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions) named `SWAGGERHUB_API_KEY`.

Add the relevant commands to your GitHub Action or your CI system. Make sure you export the SwaggerHub API key as a build environment variable in the action.

```
env:
  SWAGGERHUB_API_KEY: ${{ secrets.SWAGGERHUB_API_KEY }}
```

```
- name: Install SmartBear CLI
  run: npm i -g swaggerhub-cli 
- name: Install AppMap tools
  uses: getappmap/install-action@v1

- name: Set API Version Number
  run: echo "OPENAPI_VERSION"=$(cat openapi-version) >> "$GITHUB_ENV"

- name: Generate OpenAPI with AppMap
  run: appmap openapi --output-file openapi.yml --openapi-title <repo name> --openapi-version ${OPENAPI_VERSION}

- name: Publish API to SmartBear
  run: swaggerhub api:create <swaggerhub team>/<repo name> --file openapi.yml

- name: Set Latest API Default
  run: swaggerhub api:setdefault <swaggerhub team>/<repo name>/${OPENAPI_VERSION}
```

Refer to [this project on GitHub](https://github.com/land-of-apps/rails_tutorial_sample_app_7th_ed/blob/smartbear-integration/.github/workflows/openapi-publish.yml) for a fully working example of this GitHub Action.

After your build job completes, you'll see your latest version of your API imported into SwaggerHub. 

<img class="video-screenshot" src="/assets/img/swaggerhub-api.webp"/> 

Next, navigate to your SwaggerHub Portal administration page, select on your project and find the latest release of the uploaded API. 

<img class="video-screenshot" src="/assets/img/swaggerhub-portal-link.webp"/>

When you are ready to publish this API to your users and customers, simply click the "Link API" button. 

<img class="video-screenshot" src="/assets/img/swaggerhub-publish.webp"/>

After it's published, you'll see the latest revision now available in your SwaggerHub Portal

<img class="video-screenshot" src="/assets/img/swaggerhub-portal.webp"/>

## Disable Deployment when Runtime OpenAPI Diverges from SwaggerHub API

Because we are going to be using the SwaggerHub CLI inside of our CI/GitHub action

### Configuration
Because we are going to be using the SwaggerHub CLI inside of our CI/GitHub action you'll need to store the API key as an [encrypted secret](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions) in your GitHub action.

Access your API key on the [user settings page](https://app.swaggerhub.com/settings/apiKey) in SwaggerHub. Store this as an encrypted secrete named `SWAGGERHUB_API_KEY`.

Add the relevant commands to your GitHub Action or your CI system. Make sure you export the SwaggerHub API key as a build environment variable in the action.

```
env:
  SWAGGERHUB_API_KEY: ${{ secrets.SWAGGERHUB_API_KEY }}
```

```
- name: Install SmartBear CLI
  run: npm i -g swaggerhub-cli 
- name: Install AppMap tools
  uses: getappmap/install-action@v1

- name: Set API Version Number
  if: always() 
  run: echo "OPENAPI_VERSION"=$(cat openapi-version) >> "$GITHUB_ENV"

- name: Generate OpenAPI with AppMap
  run: appmap openapi --output-file openapi.yml --openapi-title <repo name> --openapi-version ${OPENAPI_VERSION}

- name: Get Latest Default
  if: always()
  run: swaggerhub api:get <swaggerhub team>/<repo name> > swaggerhub-api.yml

- name: Normalize OpenAPI Files
  if: always()
  run: cat openapi.yml | sed '/^$/d' > openapi-clean.yml && cat swaggerhub-api.yml | sed '/^$/d' > swaggerhub-clean.yml

- name: Compare Actual vs SwaggerHub
  if: always()
  run: diff openapi-clean.yml swaggerhub-clean.yml 
```

Refer to [this project on GitHub](https://github.com/land-of-apps/rails_tutorial_sample_app_7th_ed/blob/smartbear-api-comparison/.github/workflows/openapi-compare.yml) for a fully working example of this GitHub Action.

With this configuratino enabled, when a user makes a commit which changes the routes that are NOT currently in the published API spec on SwaggerHub this build will fail and the user will be unable to deploy unless they update the API spec on SwaggerHub or remove the offending changes. 

<img class="video-screenshot" src="/assets/img/swaggerhub-github-build-failure.webp"/>
