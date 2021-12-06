## `missingAuthentication`

HTTP server request is missing authentication.

### Scope

`http_server_request`

### Events checked

- `http_server_response.status < 300`
- Matches whitelists of route and content type

### Match condition

- Does not have a descendant event labeled `public`.
- Does not have a descendant event labeled `security.authentication`.

### Options

- `includeContentTypes MatchPatternConfig[]`. Default: any content type.
- `excludeContentTypes MatchPatternConfig[]`. Default: any content type.
