import { stat, writeFile } from 'fs/promises';
import * as chokidar from 'chokidar';
import assert from 'assert';
import path from 'path';
import { queue } from 'async';
import { callbackify } from 'node:util';

import { formatReport } from './formatReport';
import { default as buildScanner } from './scanner';
import {
  parseConfigFile,
  TimestampedConfiguration,
} from '../../configuration/configurationProvider';
import { Telemetry } from '@appland/telemetry';
import EventEmitter from 'events';
import isAncestorPath from '../../util/isAncestorPath';
import { debuglog } from 'util';
import { warn } from 'console';

const debug = debuglog('scanner:watch');

export type WatchScanOptions = {
  appId?: string;
  appmapDir: string;
  configFile: string;
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

export class Watcher {
  config?: TimestampedConfiguration;
  appmapWatcher?: chokidar.FSWatcher;
  appmapPoller?: chokidar.FSWatcher;
  configWatcher?: chokidar.FSWatcher;
  scanEventEmitter = new EventEmitter();

  constructor(private options: WatchScanOptions) {
    this.queue.error((error, task) => console.warn(`Problem processing ${task}:\n`, error));
  }

  async watch(): Promise<void> {
    await this.reloadConfig();

    this.configWatcher = chokidar.watch(this.options.configFile, {
      ignoreInitial: true,
    });
    this.configWatcher
      .on('add', this.reloadConfig.bind(this))
      .on('change', this.reloadConfig.bind(this));

    const cwd = process.cwd();
    // note: sometimes path.resolve doesn't seem to use the correct cwd unless it's provided explicitly
    const appmapDir = path.resolve(cwd, this.options.appmapDir);

    // If the appmap directory is a descendant of cwd, watch cwd (presumably project directory).
    // This ensures the watch will survive even if the appmap dir is removed and recreated.
    // Otherwise, make sure to use an existing directory. Chokidar struggles with missing directories.
    const watchDir = isAncestorPath(cwd, appmapDir) ? cwd : await existingParent(appmapDir);

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
      ignorePermissionErrors: true,
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
    this.appmapPoller.on('add', enqueue).on('change', enqueue);
    this.appmapWatcher
      .on('add', enqueue)
      .on('change', enqueue)
      .on('error', this.watcherErrorFunction.bind(this));
  }

  isError(error: unknown, code: string): boolean {
    const err = error as NodeJS.ErrnoException;
    return err.code === code;
  }

  async watcherErrorFunction(error: Error) {
    if (this.appmapWatcher && this.isError(error, 'ENOSPC')) {
      console.warn(error.stack);
      console.warn('Will disable file watching. File polling will stay enabled.');
      await this.appmapWatcher?.close();
      this.appmapWatcher = undefined;
      console.warn('File watching disabled.');
      Telemetry.sendEvent({
        name: `scan:watcher_error:enospc`,
        properties: {
          errorMessage: error.message,
          errorStack: error.stack,
        },
      });
    } else {
      // let it crash if it's some other error, to learn what the error is
      throw error;
    }
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

  // do not remove callbackify, apparently on windows
  // passing plain async function doesn't work (?)
  private queue = queue<string>(callbackify(this.scan.bind(this)), 2);

  private processing = new Set<string>();

  protected enqueue(mtimePath: string): void {
    if (this.processing.has(mtimePath)) return;
    this.processing.add(mtimePath);
    this.queue.push(mtimePath);
  }

  protected async scan(mtimePath: string): Promise<void> {
    assert(this.config, `config should always be loaded before appmapWatcher triggers a scan`);

    const perform = async () => {
      const appmapFile = [path.dirname(mtimePath), 'appmap.json'].join('.');
      const reportFile = mtimePath.replace(/mtime$/, 'appmap-findings.json');

      const [appmapStats, reportStats] = await Promise.all(
        [appmapFile, reportFile].map((f) => stat(f).catch(() => null))
      );

      if (!appmapStats) {
        warn(`[scan] AppMap file ${appmapFile} does not exist`);
        return;
      }

      const cut = (str: string) => str.substring(str.length - 8);
      assert(this.config);
      debug(
        '%s: %s, findings: %s, config: %s',
        appmapFile,
        cut(appmapStats.mtimeMs.toFixed(3)),
        reportStats && cut(reportStats.mtimeMs.toFixed(3)),
        cut(this.config.timestampMs.toFixed(3))
      );

      if (
        reportStats &&
        reportStats.mtimeMs > appmapStats.mtimeMs - 1000 &&
        reportStats.mtimeMs > this.config.timestampMs - 1000
      ) {
        warn(`[scan] Report file ${reportFile} is already up to date`);
        return;
      }

      const startTime = Date.now();
      const scanner = await buildScanner(this.config, [appmapFile]);

      const rawScanResults = await scanner.scan();
      const elapsed = Date.now() - startTime;
      this.scanEventEmitter.emit('scan', { scanResults: rawScanResults, elapsed });

      // Always report the raw data
      await writeFile(reportFile, formatReport(rawScanResults));
    };

    try {
      await perform();
    } finally {
      this.processing.delete(mtimePath);
    }
  }

  protected async reloadConfig(): Promise<void> {
    this.config = await parseConfigFile(this.options.configFile);
  }
}

export default async function watchScan(options: WatchScanOptions): Promise<void> {
  return new Watcher(options).watch();
}
