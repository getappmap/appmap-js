import type Conf from 'conf';
import * as os from 'os';
import { getMachineId } from './identity';
import { Session } from './session';

import type {
  BackendConfiguration,
  FlushCallback,
  ProductConfiguration,
  TelemetryBackend,
  ITelemetryClient,
  TelemetryConfiguration,
  TelemetryData,
  TelemetryOptions,
} from './types';
import path from 'path';
import { ApplicationInsightsBackend } from './backends/application-insights';
import { SplunkBackend } from './backends/splunk';

/**
 * Append the prefix to the name of each property and drop undefined values
 */
const transformProps = <T>(
  obj: Record<string, T | undefined>,
  propPrefix: string
): Record<string, T> => {
  const result: Record<string, T> = {};

  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (k.includes('.')) {
      result[k] = v;
      continue;
    }
    const prefixedKey = k.startsWith(propPrefix) ? k : `${propPrefix}${k}`;
    result[prefixedKey] = v;
  }

  return result;
};

function resolvePackageJson(): { name: string; version: string } | undefined {
  try {
    let myPath = __dirname;

    // If we're in a node_modules directory, go up to the consuming package root
    const nodeModuleIndex = myPath.indexOf(`${path.sep}node_modules${path.sep}`);
    if (nodeModuleIndex !== -1) {
      myPath = myPath.substring(0, nodeModuleIndex);
    }
    // Loaded here rather than at the top: it is needed only when the caller
    // does not name the product, and its load time shows in a short command.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const readPackageUp = require('read-pkg-up') as typeof import('read-pkg-up');
    const result = readPackageUp.sync({ cwd: myPath })?.packageJson;
    if (result) {
      return {
        name: result.name,
        version: result.version,
      };
    }
  } catch (error) {
    console.error('Error resolving package.json:', error);
    return undefined;
  }
}

function defaultBackend(): BackendConfiguration {
  switch (process.env.APPMAP_TELEMETRY_BACKEND) {
    case 'application-insights':
    case 'splunk':
      return {
        type: process.env.APPMAP_TELEMETRY_BACKEND,
      };
  }
  // Default to application insights if no backend is specified
  // or if the specified backend is not recognized.
  // This is to maintain backward compatibility.
  return { type: 'application-insights' };
}

function buildDefaultConfiguration(
  base: Partial<TelemetryConfiguration> = {}
): TelemetryConfiguration {
  const product: Required<ProductConfiguration> = { name: '', version: '', ...base.product };
  if (!product.name || !product.version) {
    const pkg = resolvePackageJson();
    product.name ||= pkg?.name || 'unknown';
    product.version ||= pkg?.version || '0.0.0';
  }

  // By default, the prop prefix will be the product name with non-word characters replaced by dots.
  const propPrefix = base.propPrefix || product.name.replace(/\W/g, '.').replace(/^\./, '') + '.';
  const backend = base.backend || defaultBackend();
  const properties: Record<string, string> = {
    'common.source': product.name,
    'common.os': os.platform(),
    'common.platformversion': os.release(),
    'common.arch': os.arch(),
    'common.hostname': os.hostname(),
    ...base.properties,
  };

  // include username automatically for splunk backend
  if (backend.type === 'splunk')
    try {
      properties['common.username'] ??= os.userInfo().username;
    } catch {
      // ignore
    }

  if (process.env.APPMAP_TELEMETRY_PROPERTIES) {
    try {
      const clientInfo = JSON.parse(process.env.APPMAP_TELEMETRY_PROPERTIES) as Record<
        string,
        string
      >;
      Object.assign(properties, transformProps(clientInfo, 'common.'));
    } catch {
      // ignore
    }
  }

  return {
    product,
    propPrefix,
    backend,
    properties,
    ...base,
  };
}

/** Interpret a boolean as coming from an environment variable.
 * If the value is undefined, return the defaultValue.
 * If the value is '1', 'true', or 'yes' (case insensitive), return true.
 * If the value is '0', 'false', or 'no' (case insensitive), return false.
 * Otherwise, return the defaultValue.
 */
function stringToBool(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined) return defaultValue;
  switch (value.toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
      return true;
    case '0':
    case 'false':
    case 'no':
      return false;
    default:
      return defaultValue;
  }
}

export class TelemetryClient implements ITelemetryClient {
  private telemetryConfig?: TelemetryConfiguration;
  private _backend?: TelemetryBackend;
  private _userConfig?: Conf;
  public debug = stringToBool(process.env.APPMAP_TELEMETRY_DEBUG);
  private _session?: Session;

  public enabled = !stringToBool(process.env.APPMAP_TELEMETRY_DISABLED);
  public readonly machineId = getMachineId();
  public get sessionId(): string {
    if (!this.telemetryConfig) {
      throw new Error('Session is not initialized');
    }
    return this.session.id;
  }

  constructor(config?: Partial<TelemetryConfiguration>) {
    if (config) this.configure(config);
  }

  public configure(config: Partial<TelemetryConfiguration> = {}): void {
    if (this.telemetryConfig) {
      throw new Error('Telemetry client is already configured');
    }

    this.telemetryConfig = buildDefaultConfiguration(config);

    if (this.debug) {
      console.warn('Telemetry configuration:', this.telemetryConfig);
    }
  }

  // The user config file, the session and the backend are created on first
  // use rather than in configure(). Every CLI command configures telemetry at
  // startup and most never send an event; creating these eagerly loaded the
  // conf package and read the config file from disk on every invocation.
  private get userConfig(): Conf {
    if (!this._userConfig) {
      if (!this.telemetryConfig) throw new Error('Telemetry client is not configured');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ConfClass = (require('conf') as { default: typeof Conf }).default;
      this._userConfig = new ConfClass({
        projectName: this.telemetryConfig.product.name,
        projectVersion: '0.0.1', // note this is actually config version
      });
    }
    return this._userConfig;
  }

  private get session(): Session {
    if (!this._session) this._session = new Session(this.userConfig);
    return this._session;
  }

  private get backend(): TelemetryBackend | undefined {
    if (!this._backend && this.telemetryConfig) {
      // Construct additional backends here as needed.
      switch (this.telemetryConfig.backend.type) {
        case 'application-insights':
          this._backend = new ApplicationInsightsBackend(
            this.machineId,
            this.session.id,
            this.telemetryConfig.product.name,
            this.telemetryConfig.backend
          );
          break;
        case 'custom':
          this._backend = this.telemetryConfig.backend;
          break;
        case 'splunk':
          this._backend = new SplunkBackend(this.telemetryConfig.backend);
          break;
      }
    }
    return this._backend;
  }

  sendEvent(data: TelemetryData, options: TelemetryOptions = { includeEnvironment: false }): void {
    // With telemetry disabled the event goes nowhere unless it is to be
    // printed, so do not build it, which would create the session and read
    // the user config file.
    if (!this.enabled && !this.debug) return;
    if (!this.telemetryConfig) this.configure();
    const { backend } = this;
    if (!backend || !this.telemetryConfig) throw new Error('Telemetry client is not configured');

    try {
      const { propPrefix } = this.telemetryConfig;
      const { name, version } = this.telemetryConfig.product;
      const transformedProperties = transformProps(
        {
          version: version,
          args: process.argv.slice(1).join(' '),
          ...data.properties,
        },
        propPrefix
      );
      const transformedMetrics = transformProps(data.metrics || {}, propPrefix);
      const properties: Record<string, string> = {
        'appmap.cli.machineId': this.machineId,
        'appmap.cli.sessionId': this.session.id,
        ...this.telemetryConfig.properties,
        ...transformedProperties,
      };

      if (options.includeEnvironment) {
        properties['common.environmentVariables'] = Object.keys(process.env).sort().join(',');
      }

      const event = {
        name: `${name}/${data.name}`,
        measurements: transformedMetrics,
        properties,
      };

      if (this.debug) {
        console.warn(JSON.stringify(event, null, 2));
      }

      if (this.enabled) {
        backend.sendEvent(event);
        this.session.touch();
      }
    } catch (e) {
      // Don't let telemetry fail the entire command
      // Do nothing other than log for now, we can't do anything about it
      if (this.debug) {
        if (e instanceof Error) {
          console.error(e.stack);
        } else {
          console.error(e);
        }
      }
    }
  }

  flush(callback?: FlushCallback): void {
    // A backend exists only once an event has been sent. When there is none,
    // or telemetry is disabled, there is nothing to flush, but the callback
    // must still run: callers use it to continue, for example to exit.
    const backend = this.enabled ? this._backend : undefined;
    if (backend) backend.flush(callback);
    else if (callback) callback();
  }
}

const defaultClient = new TelemetryClient();
export default defaultClient;
