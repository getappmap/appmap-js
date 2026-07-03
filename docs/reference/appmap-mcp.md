---
layout: docs
title: Docs - Reference
description: "Reference for the AppMap MCP server, which exposes recorded AppMap Data to AI assistants as read-only query tools over the Model Context Protocol."
toc: true
reference: true
step: 12
name: AppMap MCP Server
---

# AppMap MCP Server

- [AppMap MCP Server](#appmap-mcp-server)
  - [Overview](#overview)
  - [Prerequisites](#prerequisites)
    - [Install the AppMap CLI](#install-the-appmap-cli)
    - [Build the query index](#build-the-query-index)
  - [Starting the server](#starting-the-server)
    - [Options](#options)
  - [Configuring an MCP client](#configuring-an-mcp-client)
  - [Tools](#tools)
    - [Common filters](#common-filters)
    - [Orientation and ranking](#orientation-and-ranking)
    - [Finding records](#finding-records)
    - [Analyzing recordings](#analyzing-recordings)
  - [Resources](#resources)
  - [GitHub repository](#github-repository)

## Overview

The AppMap MCP server exposes recorded [AppMap Data](/docs/reference) to AI assistants as a set of read-only query tools over the [Model Context Protocol](https://modelcontextprotocol.io). Any MCP-capable client &mdash; for example an AI coding assistant or chat client &mdash; can connect to the server and ask questions about how your application actually ran: which endpoints are slow, where time is spent, what SQL was issued, what exceptions occurred, and how a single request executed end to end.

The server reads from a pre-built query database that AppMap maintains from your recorded AppMap Data. It never modifies your AppMap Data or your application &mdash; it only answers queries.

The MCP server is part of the [AppMap CLI](/docs/reference/appmap-client-cli) and is started with the `appmap query mcp` command. It communicates over standard input and output (stdio) using newline-delimited [JSON-RPC 2.0](https://www.jsonrpc.org/specification) messages, which is the standard MCP stdio transport.

## Prerequisites

### Install the AppMap CLI

The MCP server ships with the AppMap CLI. Install the `appmap` binary by following the instructions in the [AppMap CLI reference](/docs/reference/appmap-client-cli#prerequisites).

### Build the query index

The MCP server reads from a query database (`query.db`) that is derived from your recorded AppMap Data. Build or refresh this index by running the `index` command in your project:

```console
$ appmap index
```
{: .example-code}

If the query database has not been built, the MCP server reports that the query DB was not found and instructs you to run `appmap index` first. Re-run `appmap index` after recording new AppMap Data so the server queries the latest results.

<div class="alert alert-info">
If you use the AppMap plugin for <a href="/docs/reference/vscode">Visual Studio Code</a> or <a href="/docs/reference/jetbrains">JetBrains</a>, you do not need to run <code>appmap index</code> yourself. The plugin runs the index command automatically in <code>--watch</code> mode for every <code>appmap.yml</code> file it finds in your project, keeping the query database up to date as you record new AppMap Data.
</div>

## Starting the server

Run the MCP server from the root of your project:

```console
$ appmap query mcp
```
{: .example-code}

The server reads JSON-RPC requests from standard input and writes responses to standard output, one JSON object per line. All logging is written to standard error so that it does not corrupt the protocol stream &mdash; on startup the server prints `appmap mcp listening on stdio` to standard error.

In normal use you do not run this command by hand. Instead, you configure your MCP client to launch it (see [Configuring an MCP client](#configuring-an-mcp-client)).

### Options

| Option | Description |
| ------ | ----------- |
| `-d`, `--directory` | Program working directory. |
| `--appmap-dir` | Directory containing AppMap Data. |
| `--query-db` | Path to the `query.db` file, overriding the default location. |

## Configuring an MCP client

MCP clients launch the server as a stdio subprocess. Most clients accept a JSON configuration that names the command to run and the directory to run it in. The exact file and field names vary by client, but the configuration follows this shape:

```json
{
  "mcpServers": {
    "appmap": {
      "command": "appmap",
      "args": ["query", "mcp"]
    }
  }
}
```

By default the server queries the project in the client's working directory. To query a different project, pass `--directory` in `args`. Use the `--appmap-dir` or `--query-db` options if your AppMap Data or query database lives in a non-default location. Make sure the `appmap` binary is on the `PATH` available to the client, or use an absolute path for `command`.

<div class="alert alert-info">
The query database must already exist before the client connects. Run <code>appmap index</code> in the project first, and re-run it whenever you record new AppMap Data.
</div>

## Tools

The server exposes the following tools. Every list tool returns a paged result of the form `{ rows, total, limit, offset }`, and every tool returns its result as JSON. When orienting against an unfamiliar project, start with `list_endpoints` to see the available routes and where time and errors are concentrated.

### Common filters

Most tools accept a shared set of optional filters to narrow results:

| Filter | Description |
| ------ | ----------- |
| `route` | Limit to a specific HTTP route (for example `GET /users/:id`). |
| `status` | Limit to a specific HTTP status code. |
| `duration` | Limit to records at or above a minimum elapsed time. |
| `branch` | Limit to recordings captured on a git branch. |
| `commit` | Limit to recordings captured at a git commit. |
| `since`, `until` | Limit to a time range. |
| `appmap` | Limit to a single recording, identified by its canonical path. |
| `limit`, `offset` | Page through results. |

### Orientation and ranking

| Tool | Description |
| ---- | ----------- |
| `list_endpoints` | Per-route summary table with request count, average and p95 latency, and error rate. The recommended first call when exploring a project. Sort by `count`, `avg`, `p95`, or `err`. |
| `function_hotspots` | Functions ranked by total elapsed time across recordings, with a representative source path, line number, and fully-qualified id. Filter by `route` or `class`. |
| `sql_hotspots` | SQL queries ranked by total elapsed time, deduplicated by query text, with call count and average latency. |
| `list_labels` | AppMap [labels](/docs/reference/analysis-labels) ranked by usage, with a sample function id for each label. |

### Finding records

| Tool | Description |
| ---- | ----------- |
| `find_recordings` | Recording-level rows (one per AppMap recording), with a canonical `path` and a `kind` of `junit`, `request`, or `other`. Use the returned `path` as the `appmap` argument to other tools. |
| `find_requests` | Individual HTTP server requests, with method, route, status code, elapsed time, and branch. |
| `find_queries` | Individual SQL queries, with query text, elapsed time, and the calling class and method. Filter by `table`, `class`, or `method`. |
| `find_calls` | Individual function calls, including captured parameters and return values. Filter by `class`, `method`, `label`, or exact `event_id`s. When a class or method matches nothing, the result includes a "did you mean" suggestion. |
| `find_logs` | Application log lines captured during recordings. Filter by `message` or `logger`. |
| `find_exceptions` | Exceptions raised during recordings. Use `with_logs` to attach the most recent preceding log lines to each exception. |

### Analyzing recordings

| Tool | Description |
| ---- | ----------- |
| `get_call_tree` | The call tree of a single recording (identified by its `appmap` path). Focus on a function, SQL query, or HTTP request with `focus_type` and `focus_value`; control breadth with `parent_depth`, `child_depth`, and `min_elapsed_ms`. Returns a byte-budgeted text tree by default, or full JSON nodes with `format: json`. |
| `find_related` | Recordings ranked by similarity to a source recording, scoring shared routes, SQL tables, and classes. Useful for finding other recordings that exercise the same code. |
| `compare_branches` | Per-route p95 latency for two branches (`branch_a` and `branch_b`) with the delta between them. Sort by `delta`, `p95-a`, or `p95-b`. |

## Resources

In addition to tools, the server exposes the following MCP resources:

| Resource | Description |
| -------- | ----------- |
| `appmap://endpoints` | All HTTP endpoints with request count, average latency, p95 latency, and error rate, as JSON. |
| `appmap://recording/{ref}/logs` | All log lines for a single recording, where `{ref}` is the URL-encoded canonical path of the recording. |

## GitHub repository

[https://github.com/getappmap/appmap-js/tree/main/packages/cli](https://github.com/getappmap/appmap-js/tree/main/packages/cli)
