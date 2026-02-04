### **Proposal: Modernizing the Release Pipeline with Floating Git Tags**

#### **1. Objective**

The primary goal is to re-architect the release process for the AppMap monorepo to enable the use of **npm trusted publishing (OIDC)**. The current process, which relies on a multi-stage "tagging dance" with `npm dist-tag`, is incompatible with OIDC and creates a potential race condition for clients downloading native binaries.

This proposal outlines a new model using **floating Git tags** as stable pointers to the latest complete releases, decoupling client discovery from the npm registry and creating a more robust, secure, and atomic release pipeline.

---

#### **2. The New Architecture**

The core of this new architecture is to stop using `npm dist-tag` as a pointer. Instead, we will use the repository's Git tags and the GitHub Releases API as the single source of truth.

1.  **Stable Pointer Tags:**
    We will create and maintain stable, "floating" Git tags that do not contain a version number. Each tag will act as a permanent alias for the latest valid release of a specific tool.
    *   `appmap-latest`: Will always point to the commit of the latest `@appland/appmap-v*` release.
    *   `scanner-latest`: Will always point to the commit of the latest `@appland/scanner-v*` release.

2.  **Atomic Release Finalization:**
    These pointer tags are only moved *after* a new version has been fully released and all its associated native binaries have been successfully built and uploaded to the corresponding GitHub Release. This is the key change that eliminates the race condition.

3.  **Client Discovery:**
    The IDE extensions (VS Code, JetBrains) will be updated to find the latest tools by querying a stable GitHub API endpoint. For example, to find the latest AppMap tool, a client would make a `GET` request to:
    `https://api.github.com/repos/applandinc/appmap-js/releases/tags/<stable-tag>`

    The GitHub API automatically resolves this "floating" tag and returns the full JSON object for the underlying release (e.g., the release for `@appland/appmap-v1.2.3`), which includes the version number, changelog, and a list of all asset download URLs.

---

#### **3. Implementation Plan**

This is a two-part implementation, requiring changes to the CI/CD workflows and the client-side IDE extensions.

##### **Part 1: CI/CD Workflow Modifications**

1.  **`release.yml` (JavaScript Publishing Workflow):**
    *   This workflow will be configured for true **trusted publishing**.
    *   **Action:** Add `permissions: id-token: write` to the `release` job.
    *   **Action:** Remove the `YARN_NPM_AUTH_TOKEN` environment variable. The workflow will now authenticate with npm using the OIDC token provided by the GitHub Actions runner.
    *   `semantic-release` can now publish the JS packages directly with the `latest` dist-tag, as this tag is no longer used by the native asset clients for discovery.

2.  **`build-native.yml` & `build-native-scanner.yml` (Native Binaries Workflows):**
    *   The primary logic for building and uploading binaries to a GitHub Release remains the same.
    *   The `finalize-release` job at the end of each workflow will be fundamentally changed.
    *   **Action:** Remove the step that runs `yarn npm tag add ...`.
    *   **Action:** Add a new step, "Update Stable Pointer Tag", with the following logic:

    ```yaml
    - name: Update Stable Pointer Tag
      env:
        GH_TOKEN: ${{ secrets.GH_TOKEN }}
      run: |
        # Configure Git to use the PAT for pushing
        git config user.name "appland-release"
        git config user.email "release@app.land"

        # Determine which stable tag to move based on the version tag
        STABLE_TAG=""
        if [[ "${{ github.ref_name }}" == "@appland/appmap"* ]]; then
          STABLE_TAG="appmap-latest"
        elif [[ "${{ github.ref_name }}" == "@appland/scanner"* ]]; then
          STABLE_TAG="scanner-latest"
        else
          echo "Not a release tag. Skipping pointer update."
          exit 0
        fi

        echo "Updating stable tag '${STABLE_TAG}' to point to '${{ github.ref_name }}'"

        # Use '-f' to move the tag if it already exists
        git tag -f "${STABLE_TAG}" "${{ github.ref_name }}"

        # Use --force to push the updated tag to the remote
        git push --force origin "refs/tags/${STABLE_TAG}"
    ```

##### **Part 2: Client-Side Extension Modifications**

The logic in the VS Code and JetBrains extensions for finding and downloading the native tools needs to be updated.

1.  **Current Logic (To be removed):**
    *   Shell out to run `npm view @appland/appmap version` to get the latest version string.
    *   Construct a download URL based on the version string.

2.  **New Logic (To be implemented):**
    *   Define the stable pointer tag (e.g., `appmap-latest`).
    *   Make an HTTP GET request to the GitHub API endpoint: `https://api.github.com/repos/applandinc/appmap-js/releases/tags/<stable-tag>`.
    *   Parse the JSON response. The `tag_name` field will give the precise version.
    *   Iterate through the `assets` array in the JSON response. Find the asset whose name matches the user's platform and architecture (e.g., `appmap-linux-x4`).
    *   Download the binary from the `browser_download_url` provided for that asset.
    *   **Action:** After download, calculate the SHA256 checksum of the file and verify that it matches the `digest` field from the manifest. This provides a crucial integrity and security check.

---

#### **4. Benefits of This Architecture**

*   **Enables Trusted Publishing:** Completely removes the final blocker for adopting OIDC for `npm publish`.
*   **Atomic Releases:** The pointer tag is only moved after all binaries are confirmed to be uploaded, eliminating any race condition. A client will never be directed to an incomplete release.
*   **Increased Resilience:** Client discovery becomes dependent only on the GitHub API, not the npm registry.
*   **Single Source of Truth:** The GitHub Release becomes the canonical source for all release artifacts and metadata, simplifying the release process and the client logic.
*   **Enhanced Security:** The inclusion of checksum verification provides a strong guarantee of asset integrity, protecting against accidental corruption and providing a second layer of defense.

---

### **5. Advanced Capabilities Unlocked by This Design**

#### **Enterprise Asset Mirroring**

This architecture provides a straightforward path for enterprise clients who need to host all tool assets on an internal, mirrored server for security and compliance reasons.

The JSON response from the GitHub API endpoint effectively serves as a dynamic "manifest." Because the client-side extensions will be designed to fetch from a configurable URL, mirroring can be supported with minimal effort:

1.  **Client-Side Configuration:** The IDE extensions will have a new configuration setting (e.g., `appmap.tool.manifestUrl`) that defaults to the public GitHub API endpoint.
2.  **Enterprise Implementation:** An enterprise client can override this URL to point to an internal server.
3.  **Mirroring Process:** The client is responsible for a simple mirroring process:
    *   Periodically fetch the official manifest JSON from the GitHub API.
    *   Download all binary assets listed in the manifest to their internal artifact server, verifying each one against its checksum.
    *   Host a modified version of the manifest JSON file. This file **must** preserve the original `digest` field for each asset. The `browser_download_url` for each asset should be updated to point to its new location on the internal mirror. This extends the chain of trust to the mirrored assets.

#### **Minimal Manifest Structure**

Clients wishing to create their own mirrored manifest file only need to replicate a small subset of the fields provided by the GitHub Releases API. The client-side parsing logic will only rely on the following structure:

```json
{
  "tag_name": "@appland/appmap-v1.2.3",
  "assets": [
    {
      "name": "appmap-linux-x64",
      "browser_download_url": "https://<internal-mirror>/path/to/appmap-linux-x64",
      "digest": "sha256:..."
    },
    {
      "name": "appmap-macos-arm64",
      "browser_download_url": "https://<internal-mirror>/path/to/appmap-macos-arm64",
      "digest": "sha256:..."
    },
    {
      "name": "appmap-win-x64.exe",
      "browser_download_url": "https://<internal-mirror>/path/to/appmap-win-x64.exe",
      "digest": "sha256:..."
    }
  ]
}
```

*   **`tag_name` (string):** The precise version of the release. This is used for display and diagnostics.
*   **`assets` (array of objects):** The list of available binary artifacts.
    *   **`name` (string):** The unique filename for the asset, used by the client to find the correct binary for its platform and architecture.
    *   **`browser_download_url` (string):** The fully-qualified URL from which to download the asset.
    *   **`digest` (string):** The SHA256 checksum of the asset, prefixed with `sha256:`. This is used to verify the integrity of the downloaded file.