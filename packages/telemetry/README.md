# AppMap Telemetry

This package provides a shared telemetry client for AppMap projects. It supports multiple backends and offers flexible configuration options.

## Usage

```typescript
import { Telemetry } from '@appland/telemetry';

const telemetry = new Telemetry();

telemetry.configure({
  product: {
    name: 'My App',
    version: '1.0.0',
  },
});

telemetry.sendEvent({
  name: 'my-event',
  properties: {
    'my-property': 'my-value',
  },
  metrics: {
    'my-metric': 123,
  },
});
```

## Configuration

The telemetry client can be configured using environment variables.

### General Configuration

*   `APPMAP_TELEMETRY_DISABLED`: Set to `1`, `true`, or `yes` to disable telemetry.
*   `APPMAP_TELEMETRY_DEBUG`: Set to `1`, `true`, or `yes` to enable debug logging, which will print telemetry events to the console.
*   `APPMAP_TELEMETRY_BACKEND`: Specifies the telemetry backend to use. Supported values are `application-insights` (default) and `splunk`.

### Splunk Backend

When `APPMAP_TELEMETRY_BACKEND` is set to `splunk`, the following environment variables are used:

*   `SPLUNK_TOKEN`: **(Required)** The Splunk HTTP Event Collector (HEC) token.
*   `SPLUNK_URL`: **(Required)** The Splunk HEC URL.
*   `SPLUNK_CA_CERT`: Used to configure TLS verification and custom Certificate Authorities (CAs).
    *   **Not set (default):** TLS verification is disabled (`rejectUnauthorized: false`). This allows the use of self-signed certificates, which is common in Splunk deployments.
    *   `system`: Use the system's trusted Certificate Authorities. TLS verification is enabled.
    *   `@/path/to/ca.pem`: Use the specified file as the Certificate Authority. The path must be prefixed with `@`. TLS verification is enabled.
    *   `<certificate content>`: Use the value of the environment variable as the Certificate Authority. TLS verification is enabled.

### Application Insights Backend

When `APPMAP_TELEMETRY_BACKEND` is set to `application-insights`, the client will use a default instrumentation key. This can be overridden by providing an `instrumentationKey` in the configuration:

```typescript
telemetry.configure({
  // ...
  backend: {
    type: 'application-insights',
    instrumentationKey: 'YOUR_INSTRUMENTATION_KEY',
  },
});
```
