---
layout: docs
title: Docs - Navie
name: Review Your Code
step: 4
navie: true
description: Use AppMap Navie to review your code. The Review Your Code command analyzes your code changes and provides a comprehensive report to help you improve code quality, security, and performance.
---

# Review Your Code

The `Review Your Code` command analyzes your code changes and provides a comprehensive report to help you improve code quality, security, and performance. This document describes the output of the command and how you can interact with it.

## Starting a Review

To start a review, open the Navie sidebar and click the `Review Your Code` button. You can also start a review using the command palette or command menu.

### VSCode

Command Palette: `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows/Linux), followed by typing `AppMap: Review Your Code`.

<img class="video-screenshot" src="/assets/img/product/navie-sidebar.png"/>

### JetBrains

From the menu, navigate to `Tools` → `AppMap` → `Review Your Code`.

## Suggestions Overview

The core of the review provides specific, actionable suggestions for improving the code. Suggestions are grouped by category (e.g., `Security`, `Performance`, `SQL`, `HTTP`) and prioritized as `high`, `medium`, or `low`.

Each suggestion includes:

- **Category:** The type of suggestion (e.g., `Security`, `Performance`, `SQL`, `HTTP`).
- **Priority:** The urgency of the suggestion, which can be `high`, `medium`, or `low`.
- **Description:** A short summary of the suggestion (e.g., "N+1 query detected").
- **Location:** The file and line number where the suggestion applies.
- **Code Snippet:** The relevant lines of code for context.
- **AppMap References:** When a suggestion is derived from runtime analysis, it will include links to the AppMap sequence diagrams that provide evidence for the suggestion.

## Triage Actions

After receiving a review, you can perform triage on the reported suggestions and features to manage the feedback and integrate it into your workflow.

### Interacting with Suggestions

Each suggestion is an individual item that you can act upon. The following actions are available:

- **Fix:** Use this action to launch a Navie window that will automatically run a sequence of commands to fix the issue.
- **Mark as Done:** Once you have implemented a suggestion, you can mark it as Done.
- **Dismiss:** If a suggestion is not applicable or you do not wish to act on it, you can dismiss it. This helps the tool refine its analysis and avoid suggesting the same item in future reviews.

## Command-Line Usage

To perform this review using the command line, you can use the following command:

```bash
appmap navie "@review /review2 /base=<base-branch> /format=<format>"
```

**base**

The base branch is optional, and defaults to `main`, `master`, or `develop`, depending on the Git history of the current project. The base branch can be any name that Git recognizes, such as a tag or a specific commit hash.

**format**

The command can produce output in several formats:

- **`text` (Default):** A human-readable Markdown report, suitable for viewing in a terminal or a text editor.
- **`json`:** A single JSON object that contains the complete review report. This is useful for programmatic analysis.
- **`jsonl`:** A stream of newline-delimited JSON objects. This format is ideal for processing results incrementally.
