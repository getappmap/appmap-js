---
layout: docs
title: Docs - Integrations
description: "Optimize your AppMap API interaction with Readme's developer hub. Easily add new endpoints and sync with your GitHub Action or CI system for efficient documentation."
integrations: true
name: Readme
step: 6
---

# Readme

[Readme](https://readme.com/) is a powerful developer hub that can consume your OpenAPI definition and provide a simple way for users to interact with your API directly from your documentation site or with the included client SDKs that Readme provides. 

<img class="video-screenshot" src="/assets/img/readme-api-documentation.webp"/> 

Simply access your Readme administration page, and go to _API Settings_ to add a new endpoint. 

<img class="video-screenshot" src="/assets/img/readme-github-action.webp"/> 

Add the relevant commands to your GitHub Action or your CI system. Make sure to save the Readme API key as an [encrypted secret in your build task.](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

```
- name: Install rdme
  run: npm install rdme@latest -g
- name: Install AppMap tools
  uses: getappmap/install-action@v1
- name: AppMap Generate OpenAPI Definitions
  run: appmap openapi --output-file openapi.yml
- name: Push OpenAPI to Readme
  run: rdme openapi openapi.yml --version=v1.0 --key="${{ secrets.RDME_KEY }}"
```

After your build job completes you'll see your API imported into Readme.

<img class="video-screenshot" src="/assets/img/readme-openapi-imported.png"/> 

And when navigating into any of your API endpoints, you'll see notifications that this API is _synced from Swagger.

<img class="video-screenshot" src="/assets/img/readme-openapi-synced.png"/> 