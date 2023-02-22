import { networkInterfaces } from 'os';
import { randomBytes, createHash, BinaryLike } from 'crypto';
import * as os from 'os';
import { sync as readPackageUpSync } from 'read-pkg-up';
import { TelemetryClient, setup as AppInsights } from 'applicationinsights';
import Conf from 'conf';
import { exec as execCallback, spawn } from 'child_process';
import { promisify } from 'util';
import { PathLike } from 'fs';

const exec = promisify(execCallback);

const { name, version } = (() => {
  const result = readPackageUpSync({ cwd: __dirname })?.packageJson;
  if (!result) throw 'cannot find package.json';
  return result;
})();

const config = new Conf({
  projectName: '@appland/appmap', // make sure all tools use the same config files
  projectVersion: '0.0.1', // note this is actually config version
});

const invalidMacAddresses = new Set([
  '00:00:00:00:00:00',
  'ff:ff:ff:ff:ff:ff',
  'ac:de:48:00:11:22',
]);

// This key is meant to be publically shared. However, I'm adding a simple
// obfuscation to mitigate key scraping bots on GitHub. The key is split on
// hypens and base64 encoded without padding.
// key.split('-').map((x) => x.toString('base64').replace(/=*/, ''))
const INSTRUMENTATION_KEY = ['NTBjMWE1YzI', 'NDliNA', 'NDkxMw', 'YjdjYw', 'ODZhNzhkNDA3NDVm']
  .map((x) => Buffer.from(x, 'base64').toString('utf8'))
  .join('-');

function getMachineId(): string {
  const machineId = config.get('machineId') as string | undefined;
  if (machineId) {
    return machineId;
  }

  let machineIdSource: BinaryLike | undefined;

  // Derive a machine ID from the first network interface
  machineIdSource = Object.values(networkInterfaces())
    .flat()
    .map((iface) => iface?.mac)
    .filter((mac) => mac && !invalidMacAddresses.has(mac))
    .shift();

  if (!machineIdSource) {
    // Fallback to a random string
    machineIdSource = randomBytes(32);
  }

  const machineIdHash = createHash('sha256')
    .update(machineIdSource as BinaryLike)
    .digest('hex');

  config.set('machineId', machineIdHash);

  return machineIdHash;
}

class Session {
  public id: string;
  public expiration: number;

  constructor() {
    const sessionId = config.get('sessionId') as string | undefined;
    const sessionExpiration = config.get('sessionExpiration') as number | undefined;

    if (sessionId && sessionExpiration && !Session.beyondExpiration(sessionExpiration)) {
      this.id = sessionId;
      this.expiration = sessionExpiration;
    } else {
      this.id = Session.newSessionId();
      this.expiration = Session.expirationFromNow();
      config.set('sessionId', this.id);
      config.set('sessionExpiration', this.expiration);
    }
  }

  static beyondExpiration(expiration: number): boolean {
    return expiration <= Date.now();
  }

  static expirationFromNow(): number {
    return Date.now() + 1000 * 60 * 30;
  }

  static newSessionId(): string {
    return createHash('sha256').update(randomBytes(32)).digest('hex');
  }

  touch(): void {
    this.expiration = Session.expirationFromNow();
    config.set('sessionExpiration', this.expiration);
  }

  get valid(): boolean {
    return !Session.beyondExpiration(this.expiration);
  }
}

export interface TelemetryData {
  name: string;
  properties?: Record<string, string | undefined>;
  metrics?: Record<string, number | undefined>;
}

const propPrefix =
  name === '@appland/appmap' ? 'appmap.cli.' : name.replace('@', '').replace('/', '.') + '.';

/**
 * Append the prefix to the name of each property and drop undefined values
 */
const transformProps = <T>(obj: Record<string, T | undefined>): Record<string, T> => {
  const result: Record<string, T> = {};

  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const prefixedKey = k.startsWith(propPrefix) ? k : `${propPrefix}${k}`;
    result[prefixedKey] = v;
  }

  return result;
};

export interface TelemetryOptions {
  includeEnvironment: boolean;
}

export default class Telemetry {
  private static _session?: Session;
  private static _client?: TelemetryClient;
  private static debug = process.env.APPMAP_TELEMETRY_DEBUG !== undefined;
  public static readonly machineId = getMachineId();

  static get enabled(): boolean {
    return process.env.APPMAP_TELEMETRY_DISABLED === undefined;
  }

  static get session(): Session {
    if (!this._session?.valid) {
      this._session = new Session();
    }

    return this._session;
  }

  static get client(): TelemetryClient {
    if (!this._client) {
      // Do not allow Application Insights to try and collect additional metadata
      process.env.APPLICATION_INSIGHTS_NO_STATSBEAT = '1';

      // Disable everything we can, we don't any additional collection from Application Insights.
      AppInsights(INSTRUMENTATION_KEY)
        .setAutoCollectRequests(false)
        .setAutoCollectPerformance(false)
        .setAutoCollectExceptions(false)
        .setAutoCollectDependencies(false)
        .setAutoCollectHeartbeat(false)
        .setAutoDependencyCorrelation(false)
        .setAutoCollectConsole(false)
        .setInternalLogging(false, false)
        .setSendLiveMetrics(false)
        .setUseDiskRetryCaching(true);

      const client = new TelemetryClient(INSTRUMENTATION_KEY);
      client.context.tags[client.context.keys.userId] = Telemetry.machineId;
      client.context.tags[client.context.keys.sessionId] = Telemetry.session.id;
      client.context.tags[client.context.keys.cloudRole] = name;
      client.setAutoPopulateAzureProperties(false);

      this._client = client;
    }

    return this._client;
  }

  static sendEvent(
    data: TelemetryData,
    options: TelemetryOptions = { includeEnvironment: false }
  ): void {
    try {
      const transformedProperties = transformProps({
        version: version,
        args: process.argv.slice(1).join(' '),
        ...data.properties,
      });
      const transformedMetrics = transformProps(data.metrics || {});
      const properties: Record<string, string> = {
        'common.source': name,
        'common.os': os.platform(),
        'common.platformversion': os.release(),
        'common.arch': os.arch(),
        'appmap.cli.machineId': Telemetry.machineId,
        'appmap.cli.sessionId': Telemetry.session.id,
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
        console.log(JSON.stringify(event, null, 2));
      }

      if (this.enabled) {
        Telemetry.client.trackEvent(event);
        Telemetry.session.touch();
        Telemetry.client.flush();
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

  static flush(exitCB: () => unknown): void {
    if (this.enabled) {
      // Telemetry.client.flush is broken:
      // https://github.com/microsoft/ApplicationInsights-node.js/issues/871 .
      // As a result, we can fail to send telemetry data when exiting.
      //
      // If we got passed a callback, flush the data and wait for a second
      // before calling it.
      if (exitCB) {
        Telemetry.client.flush();
        setTimeout(exitCB, 1000);
      }
    } else {
      exitCB();
    }
  }
}

export enum GitState {
  NotInstalled, // The git cli was not found.
  NoRepository, // Git is installed but no repository was found.
  Ok, // Git is installed, a repository is present.
}

class GitProperties {
  static async contributors(sinceDaysAgo: number, cwd?: PathLike): Promise<Array<string>> {
    const unixTimeNow = Math.floor(Number(new Date()) / 1000);
    const unixTimeAgo = unixTimeNow - sinceDaysAgo * 24 * 60 * 60;
    try {
      const { stdout } = await exec(
        [
          'git',
          cwd && `-C ${cwd.toString()}`,
          '--no-pager',
          'log',
          `--since=${unixTimeAgo}`,
          '--format="%ae"',
        ].join(' ')
      );
      return [
        ...stdout
          .trim()
          .split('\n')
          .reduce((acc, email) => {
            acc.add(email);
            return acc;
          }, new Set<string>()),
      ];
    } catch {
      return [];
    }
  }

  static async state(cwd?: PathLike): Promise<GitState> {
    return new Promise<GitState>((resolve) => {
      try {
        const commandProcess = spawn('git', ['status'], {
          shell: true,
          cwd: cwd?.toString(),
        });
        commandProcess.on('close', (code) => {
          switch (code) {
            case 127:
              return resolve(GitState.NotInstalled);
            case 128:
              return resolve(GitState.NoRepository);
            default:
              return resolve(GitState.Ok);
          }
        });
        commandProcess.on('error', () => GitState.NotInstalled);
      } catch {
        resolve(GitState.NotInstalled);
      }
    });
  }
}

const gitCache = new Map<string | symbol, unknown>();

// GitProperties is available externally as Git.
// This export provides a simple caching layer around GitProperties to avoid
// excessive shelling out to git.
export const Git = new Proxy(GitProperties, {
  get(target, prop) {
    type TargetProp = keyof typeof target;
    if (typeof target[prop as TargetProp] === 'function') {
      return new Proxy(target[prop as TargetProp], {
        apply(target, thisArg, argArray) {
          const cacheKey = `${prop.toString()}(${JSON.stringify(argArray)})`;
          if (gitCache.has(cacheKey)) {
            return gitCache.get(cacheKey);
          }
          /* eslint-disable-next-line @typescript-eslint/ban-types */
          const result: unknown = Reflect.apply(target as Function, thisArg, argArray);
          if (result instanceof Promise) {
            return result.then((r) => {
              gitCache.set(cacheKey, r);
              return r as unknown;
            });
          }
          return result;
        },
      }) as unknown;
    }
    return Reflect.get(target, prop) as unknown;
  },
});
