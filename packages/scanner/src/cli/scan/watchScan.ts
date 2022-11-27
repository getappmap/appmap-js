import { stat, writeFile } from 'fs/promises';
import * as chokidar from 'chokidar';
import assert from 'assert';
import path from 'path';
import { queue } from 'async';

import { formatReport } from './formatReport';
import { default as buildScanner } from './scanner';
import {
  parseConfigFile,
  TimestampedConfiguration,
} from '../../configuration/configurationProvider';
import Telemetry from '../../telemetry';
import EventEmitter from 'events';
import { WatchScanTelemetry } from './watchScanTelemetry';

export type WatchScanOptions = {
  appId?: string;
  appmapDir: string;
  configFile: string;
  sendTelemetry: boolean;
};

declare module 'async' {
  interface QueueObject<T> {
    // queues are actually iterable
    [Symbol.iterator](): Iterator<T>;
  }
}

async function isDir(targetPath: string): Promise<boolean> {
  try {
    return (await stat(targetPath)).isDirectory();
  } catch {
    return false;
  }
}

async function existingParent(targetPath: string): Promise<string> {
  while (targetPath.length > 1) {
    if (await isDir(targetPath)) break;
    targetPath = path.dirname(targetPath);
  }
  return targetPath;
}

function isAncestorPath(ancestor: string, descendant: string): boolean {
  return !path.relative(ancestor, descendant).startsWith('..');
}

export class Watcher {
  config?: TimestampedConfiguration;
  appmapWatcher?: chokidar.FSWatcher;
  appmapPoller?: chokidar.FSWatcher;
  configWatcher?: chokidar.FSWatcher;
  telemetry: WatchScanTelemetry | undefined;
  scanEventEmitter = new EventEmitter();

  constructor(private options: WatchScanOptions) {
    if (options.sendTelemetry) this.telemetry = new WatchScanTelemetry(this.scanEventEmitter);
  }

  async watch(): Promise<void> {
    await this.reloadConfig();
    Telemetry.sendEvent({
      name: 'scan:started',
    });

    this.configWatcher = chokidar.watch(this.options.configFile, {
      ignoreInitial: true,
    });
    this.configWatcher
      .on('add', this.reloadConfig.bind(this))
      .on('change', this.reloadConfig.bind(this));

    const appmapDir = path.resolve(this.options.appmapDir);

    // If the appmap directory is a descendant of cwd, watch cwd (presumably project directory).
    // This ensures the watch will survive even if the appmap dir is removed and recreated.
    // Otherwise, make sure to use an existing directory. Chokidar struggles with missing directories.
    const watchDir = isAncestorPath(process.cwd(), appmapDir)
      ? process.cwd()
      : await existingParent(appmapDir);

    // Custom ignore function needed to cut down the watch tree to just what we need.
    const ignored = (targetPath: string) => {
      // Ignore anything that isn't an ancestor or descendant of the appmap dir.
      if (!(isAncestorPath(targetPath, appmapDir) || isAncestorPath(appmapDir, targetPath)))
        return true;

      // Also make sure to not try to recurse down node_modules or .git
      const basename = path.basename(targetPath);
      return basename === 'node_modules' || basename === '.git';
    };

    this.appmapWatcher = chokidar.watch(watchDir, {
      ignoreInitial: true,
      ignored,
    });

    this.appmapPoller = chokidar.watch(watchDir, {
      ignoreInitial: false,
      ignored,
      usePolling: true,
      interval: 1000,
      persistent: false,
    });

    const enqueue = (filePath: string) =>
      path.basename(filePath) === 'mtime' && this.enqueue(filePath);
    for (const ch of [this.appmapWatcher, this.appmapPoller])
      ch.on('add', enqueue).on('change', enqueue);
  }

  async close(): Promise<void> {
    await Promise.all(
      (['appmapWatcher', 'appmapPoller', 'configWatcher'] as const).map((k) => {
        const closer = this[k]?.close();
        this[k] = undefined;
        return closer;
      })
    );
  }

  private queue = queue<string>(this.scan.bind(this), 2);

  protected enqueue(mtimePath: string): void {
    if ([...this.queue].includes(mtimePath)) return;
    this.queue.push(mtimePath);
  }

  protected async scan(mtimePath: string, callback?: () => void | ErrorCallback): Promise<void> {
    assert(this.config, `config should always be loaded before appmapWatcher triggers a scan`);

    const appmapFile = [path.dirname(mtimePath), 'appmap.json'].join('.');
    const reportFile = mtimePath.replace(/mtime$/, 'appmap-findings.json');

    const [appmapStats, reportStats] = await Promise.all(
      [appmapFile, reportFile].map((f) => stat(f).catch(() => null))
    );

    if (!appmapStats) return;

    if (
      reportStats &&
      reportStats.mtimeMs > appmapStats.mtimeMs &&
      reportStats.mtimeMs > this.config.timestampMs
    )
      return; // report is up to date

    const startTime = Date.now();
    const scanner = await buildScanner(true, this.config, [appmapFile]);

    const rawScanResults = await scanner.scan();
    const elapsed = Date.now() - startTime;
    this.scanEventEmitter.emit('scan', { scanResults: rawScanResults, elapsed });

    // Always report the raw data
    await writeFile(reportFile, formatReport(rawScanResults));

    // tell the queue that the current task is complete
    if (callback) {
      callback();
    }
  }

  protected async reloadConfig(): Promise<void> {
    this.config = await parseConfigFile(this.options.configFile);
  }
}

export default async function watchScan(options: WatchScanOptions): Promise<void> {
  return new Watcher(options).watch();
}
