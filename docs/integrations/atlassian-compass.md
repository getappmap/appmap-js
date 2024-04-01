---
layout: docs
title: Docs - Integrations
description: "Atlassian Compass is a unified platform for managing distributed software architecture. It supports visualizing OpenAPI docs via SwaggerUI, and enables file pushing through webhooks."
integrations: true
name: Atlassian Compass
step: 1
---

# Atlassian Compass

[Atlassian Compass](https://www.atlassian.com/software/compass) is a developer experience platform that brings your distributed software architecture and the teams collaborating on them together in a single, unified place. [Compass supports visualizing your OpenAPI docs using SwaggerUI](https://community.atlassian.com/t5/Compass-Alpha-articles/Visualize-your-APIs-in-Compass-with-Swagger-UI/ba-p/1814790) integrated into the main Compass application. After adding your application as a new component in Compass, and after enabling the SwaggerUI app, you can now add an additional task to push the `openapi.yml` file to Compass via a webhook. 

<img class="video-screenshot" src="/assets/img/compass-swagger-ui-config.webp"/> 

After generating an API username and token, create a step in your GitHub Action (or other CI tool) to push the file to Compass using the custom URL in the configuration page. Make sure to store the webhook URL, API user, and API key as [encrypted secrets in your build task.](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

```
  - name: AppMap Generate OpenAPI Definitions
    run: npx @appland/appmap@latest openapi --output-file openapi.yml
  - name: Push OpenAPI to Atlassian Compass
    run: curl -X PUT ${COMPASS_WEBHOOK_URL} -F file=@openapi.yml --user "$COMPASS_API_USER}:${COMPASS_API_KEY}"
```

[Refer to the Compass documentation for additional information on how to upload your definitions](https://community.atlassian.com/t5/Compass-Alpha-articles/Visualize-your-APIs-in-Compass-with-Swagger-UI/ba-p/1814790)
