### **Proposal: Modernizing the Release Pipeline with an Orphan Manifest Branch**

#### **1. Objective**

To re-architect the release process to enable **npm trusted publishing (OIDC)** by eliminating the dependency on `npm dist-tag` for client discovery. This new architecture will be more robust, eliminate race conditions, and provide powerful new features for both end-users and enterprise clients, such as version pinning and simplified asset mirroring.

---

#### **2. The New Architecture**

The core of this solution is to use a dedicated, **orphan Git branch** as the single source of truth for release metadata. This branch, named `release-manifests`, will have a separate history from `main` and will contain only JSON manifest files.

This approach is clean, robust, and leverages a battle-tested pattern for separating source code from generated release assets.

##### **Two-Tier Manifest System**

For each successful release of a tool (e.g., `appmap`), the CI process will generate and publish two distinct manifest files to the `release-manifests` branch:

1.  **Versioned Manifest:** An immutable, permanent manifest named after the full version tag (e.g., `@appland/appmap-v1.2.3.json`). This creates a complete, browsable history of all release metadata.
2.  **"Latest" Pointer Manifest:** A "floating" manifest (e.g., `appmap-latest.json`) which is an exact copy of the latest versioned manifest. This file acts as a stable pointer for clients to discover the most recent version.

---

#### **3. Implementation Plan**

##### **Part 1: CI/CD Workflow Modifications**

1.  **`release.yml` (JavaScript Publishing Workflow):**
    *   This workflow will be configured for **trusted publishing**.
    *   **Action:** Add `permissions: id-token: write` to the `release` job and remove the `YARN_NPM_AUTH_TOKEN` environment variable.
    *   **Action:** Remove the `verifyConditionsCmd` from `.releaserc.js` that previously checked for `YARN_NPM_AUTH_TOKEN`.

2.  **`build-native.yml` & `build-native-scanner.yml` (Native Binaries Workflows):**
    *   The `finalize-release` job will be responsible for generating and publishing the manifests *after* all binaries have been successfully uploaded to the GitHub Release.
    *   **Action:** Remove steps that generate and upload `.sha256` files. The digest will now be verified via the manifest.
    *   **Action:** Remove the step that runs `yarn npm tag add ...`.
    *   **Action:** Add new steps to generate and publish the manifest files.

    ```yaml
    - name: Generate Release Manifests
      id: generate_manifest
      run: |
        # This is a conceptual script. The actual implementation would query the
        # GitHub API for the release assets and construct the JSON.
        VERSION_TAG="${{ github.ref_name }}" # e.g., @appland/appmap-v1.2.3
        MANIFEST_DIR="./dist"

        # Extract the base name (e.g., appmap-v1.2.3) by stripping the @appland/ prefix
        BASE_TAG="${VERSION_TAG#@appland/}"

        # Determine the tool name (e.g., appmap) from the base tag
        TOOL_NAME="${BASE_TAG%%-v*}"

        LATEST_MANIFEST_FILENAME="${TOOL_NAME}-latest.json"
        VERSIONED_MANIFEST_FILENAME="${BASE_TAG}.json"

        echo "Generating manifest for ${VERSION_TAG}"
        # Pseudocode for manifest generation:
        # MANIFEST_CONTENT=$(gh api repos/{owner}/{repo}/releases/tags/${VERSION_TAG} | jq '{...}')
        
        mkdir -p "${MANIFEST_DIR}"
        echo "${MANIFEST_CONTENT}" > "${MANIFEST_DIR}/${VERSIONED_MANIFEST_FILENAME}"
        cp "${MANIFEST_DIR}/${VERSIONED_MANIFEST_FILENAME}" "${MANIFEST_DIR}/${LATEST_MANIFEST_FILENAME}"
        
- name: Publish Manifests to release-manifests branch
      uses: peaceiris/actions-gh-pages@v4
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_branch: release-manifests
        publish_dir: ./dist
        keep_files: true
        user_name: 'appland-release'
        user_email: 'release@app.land'
        commit_message: 'Update manifest for ${{ github.ref_name }}'

    ```

##### **Part 2: Client-Side Extension Modifications**

The client logic becomes dramatically simpler and more powerful.

1.  **Standard Discovery:**
    *   To get the latest version, the client makes a single, permanent `GET` request:
        `https://raw.githubusercontent.com/getappmap/appmap-js/release-manifests/appmap-latest.json`

2.  **Advanced Discovery (Version Pinning):**
    *   To get a specific version, the client can now construct a URL to its permanent manifest:
        `https://raw.githubusercontent.com/getappmap/appmap-js/release-manifests/@appland/appmap-v1.2.3.json`

3.  **Verification:**
    *   The client will parse the manifest, download the appropriate asset from the `browser_download_url`, and verify its integrity using the SHA256 `digest`.

---

#### **4. Benefits of This Architecture**

*   **Enables Trusted Publishing:** The dependency on `npm dist-tag` is completely removed.
*   **Atomic and Race-Free:** Clients will only see a new "latest" manifest *after* all binaries for that release are confirmed to exist.
*   **Robust History & Version Pinning:** The two-tier system provides both a stable pointer and a permanent, auditable record for every release, enabling powerful rollback and pinning scenarios.
*   **Clean Separation:** The `main` branch history remains clean. Release metadata is logically isolated in its own branch.

---

### **5. Advanced Capabilities Unlocked by This Design**

#### **Enterprise Asset Mirroring**

This design makes mirroring trivial and secure.

*   An enterprise client can override a single URL in the extension's settings to point to their own manifest mirror.
*   Their mirroring process is simple:
    1.  Download the official manifest from `.../appmap-latest.json`.
    2.  Download all assets listed in the manifest, verifying each one against its `digest`.
    3.  Upload the assets to their internal server.
    4.  Host a modified `appmap-latest.json` manifest, updating the `browser_download_url` for each asset but **preserving the original `digest`**. This extends the chain of trust.

#### **Minimal Manifest Structure**

```json
{
  "tag_name": "@appland/appmap-v1.2.3",
  "assets": [
    {
      "name": "appmap-linux-x64",
      "browser_download_url": "https://.../appmap-linux-x64",
      "digest": "sha256:..."
    }
  ]
}
```
*   **`tag_name`:** The precise version string.
*   **`assets`:** An array of release artifacts.
    *   **`name`:** The unique filename.
    *   **`browser_download_url`:** The direct download URL.
    *   **`digest`:** The SHA256 checksum, prefixed with `sha256:`.