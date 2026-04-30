---
layout: docs
title: Docs - Reference - Release Manifests
description: "Reference guide for AppMap release manifests used for version discovery and automated mirroring."
toc: true
reference: true
---

# Release Manifests

AppMap uses a manifest-based system for distributing its core binaries (`appmap` and `scanner`). This system provides a stable, machine-readable way for clients to discover new versions, verify asset integrity, and support advanced scenarios like version pinning and enterprise mirroring.

## Overview

The release manifests are JSON files hosted on a dedicated, orphan Git branch named `release-manifests` within the `appmap-js` repository. This branch serves as the single source of truth for all release metadata, independent of the `main` branch history.

## Two-Tier Manifest System

For every release, two types of manifests are generated:

1.  **Versioned Manifest:** An immutable record of a specific release.
    *   Naming convention: `[tool]-v[version].json` (e.g., `appmap-v3.197.1.json`)
2.  **Latest Pointer Manifest:** A "floating" manifest that always points to the most recent stable release.
    *   Naming convention: `[tool]-latest.json` (e.g., `appmap-latest.json`)

## Discovery URLs

Clients can discover releases by fetching manifests directly from GitHub's raw content service.

| Tool | Type | Discovery URL |
| :--- | :--- | :--- |
| **AppMap CLI** | Latest | `https://raw.githubusercontent.com/getappmap/appmap-js/release-manifests/appmap-latest.json` |
| **AppMap CLI** | Versioned | `https://raw.githubusercontent.com/getappmap/appmap-js/release-manifests/appmap-v<VERSION>.json` |
| **Scanner** | Latest | `https://raw.githubusercontent.com/getappmap/appmap-js/release-manifests/scanner-latest.json` |
| **Scanner** | Versioned | `https://raw.githubusercontent.com/getappmap/appmap-js/release-manifests/scanner-v<VERSION>.json` |

## Manifest Format

The manifest is a JSON object containing the release tag and an array of assets.

```json
{
  "tag_name": "@appland/appmap-v3.197.1",
  "assets": [
    {
      "name": "appmap-linux-x64",
      "url": "https://github.com/getappmap/appmap-js/releases/download/%40appland/appmap-v3.197.1/appmap-linux-x64",
      "digest": "sha256:405dbec9eb9e1bece9bc8acac56c33c5f404f7023f6df2918a770451c8173d25"
    },
    ...
  ]
}
```

### Fields

*   **`tag_name`**: The exact GitHub release tag associated with this manifest.
*   **`assets`**: An array of objects representing the available platform-specific binaries.
    *   **`name`**: The filename of the asset.
    *   **`url`**: The direct download URL for the asset.
    *   **`digest`**: The SHA256 checksum of the asset, prefixed with `sha256:`.

## Asset Naming Convention

The `assets` array contains the platform-specific binaries for the release. The `name` of each asset is strictly constructed using the following convention:

`[tool]-[os]-[arch][extension]`

*   **`tool`**: The name of the distributed tool (`appmap` or `scanner`).
*   **`os`**: The target operating system (`linux`, `macos`, or `win`).
*   **`arch`**: The target architecture (`x64` or `arm64`).
*   **`extension`**: Executable file extension, present only for Windows (`.exe`).

### Available Assets

For each release of a tool, the following standard set of binaries is generated and included in the manifest:

*   `[tool]-linux-x64`
*   `[tool]-linux-arm64`
*   `[tool]-macos-x64`
*   `[tool]-macos-arm64`
*   `[tool]-win-x64.exe`

## Security & Integrity

The manifest system enhances security by providing a built-in mechanism for integrity verification. 

1.  **Chain of Trust:** The manifest itself is generated and published by a trusted CI/CD process (GitHub Actions) within the official repository.
2.  **Integrity Verification:** Clients MUST verify the downloaded binary against the `digest` provided in the manifest before execution.

## Enterprise Mirroring

This architecture is designed to simplify the process of mirroring AppMap assets within secure or air-gapped enterprise environments.

### Mirroring Workflow

1.  **Fetch Manifest:** Download the official manifest from the `latest` discovery URL.
2.  **Download & Verify:** For each asset listed in the manifest:
    *   Download the file from the provided `url`.
    *   Verify its integrity using the `digest`.
3.  **Upload to Internal Host:** Upload the verified assets to your internal artifact repository or web server.
4.  **Publish Internal Manifest:** Generate a modified version of the manifest where the `url` fields point to your internal locations, while **preserving the original `digest`** values.
5.  **Configure Clients:** Point your AppMap extensions or CLI tools to use your internal manifest URL.

By preserving the original `digest`, you maintain the chain of trust even when the assets are hosted on internal infrastructure.
