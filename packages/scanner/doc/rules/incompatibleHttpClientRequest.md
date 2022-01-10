## Description

Detects HTTP client requests which are incompatible with a published OpenAPI schema.

## Rule logic

Each HTTP client request is converted to an OpenAPI schema document. This is done by examining the
request method, request URI, parameters, body, headers, etc and representing them as OpenAPI. Then,
the client OpenAPI schema is compared to the published server OpenAPI schema. If any breaking
changes are detected between the client request and the published server schema, these are reported
as findings.

## Resolution

Modify the HTTP client request to conform to the published schema.

## Options

- `schemata: Record<string, string>` A map from server hostnames to schema URLs. A schema must be
  provided for each server hostname that's invoked in the AppMap.

## Examples

```yaml
- rule: incompatibleHttpClientRequest
  parameters:
    schemata:
      'myserver:8080': https://github.com/mycorp/myserver/tree/main/openapi.yaml
```
