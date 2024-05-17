---
layout: docs
title: Docs - Reference
description: "Learn how to use the AppMap Remote Recording API to start, stop, and save AppMap Data. AppMap agent handles requests on the same port as the app."
toc: false
reference: true
name: Remote recording API
step: 11
redirect_from: [/docs/reference/remote-recording]
---

# Remote recording API <!-- omit in toc -->

- [Start a remote recording](#start-a-remote-recording)
- [Retrieve the current recording status](#retrieve-the-current-recording-status)
- [Stop a remote recording](#stop-a-remote-recording)
- [Save recorded AppMap Data to disk](#save-recorded-appmap-data-to-disk)

When an application is set up for AppMap recording, the AppMap agent injects itself into the web stack and handles the remote recording HTTP requests, accepting requests on the same port as the web interface of the application.

For example, if you deployed your application to a local Tomcat server listening on port 8080, call the remote recording endpoints at `http://localhost:8080/_appmap/*` 

##  Start a remote recording

```
POST /_appmap/record
```
{: .example-code}

No payload in the request is expected.

This endpoint returns `200` if a new recording session was started successfully or `409` if an existing recording session was already in progress. It returns an empty body in the response.

**curl example:**

```
curl -H 'Accept: application/json' -sXPOST http://localhost:8080/_appmap/record
```

## Retrieve the current recording status

```
GET /_appmap/record
```
{: .example-code}

No payload in the request is expected.

This endpoint returns status `200` .

AppMap recording status is returned in the response body, the "enabled" property is set to `true` when recording is in progress:

```
Content-type: application/json
{
  "enabled": boolean
}
```

**curl example:**

```
curl -H 'Accept: application/json' -sXGET http://localhost:8080/_appmap/record
```

## Stop a remote recording

```
DELETE /_appmap/record
```
{: .example-code}

No payload in the request is expected.

This method returns `200` If an active recording session was stopped successfully, and the body contains AppMap JSON, or `404` If there was no active recording session to be stopped.

If successful, the recorded AppMap is returned in the response body.

```
Content-type: application/json
{
  "version": "1.x",
  "metadata": {},
  "classMap": [],
  "events": [],
}
```

**curl example:**
```
curl -H 'Accept: application/json' -sXDELETE http://localhost:8080/_appmap/record -o MyFirstAppMap.appmap.json
```

## Save recorded AppMap Data to disk

Save the returned payload to disk as an `.appmap.json` file. We recommend that the AppMap file be named after the recorded test and that additional metadata is added to the recorded AppMap prior to saving, such as the AppMap’s name or labels indicating the test outcome and framework. See the [AppMap specification](https://github.com/getappmap/appmap#appmap-data-specification) for details about AppMap metadata.

