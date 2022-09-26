import { stat, writeFile } from 'fs/promises';
import * as chokidar from 'chokidar';

import Configuration from '../../configuration/types/configuration';

import { formatReport } from './formatReport';
import { default as buildScanner } from './scanner';
import { parseConfigFile } from '../../configuration/configurationProvider';
import assert from 'assert';
import path from 'path';

type WatchScanOptions = {
  appId?: string;
  appmapDir: string;
  configFile: string;
};

export class Watcher {
  config?: Configuration;
  appmapWatcher?: chokidar.FSWatcher;
  appmapPoller?: chokidar.FSWatcher;
  configWatcher?: chokidar.FSWatcher;
  private configTime?: number;

  constructor(private options: WatchScanOptions) {}

  async watch(): Promise<void> {
    await this.reloadConfig();

    this.configWatcher = chokidar.watch(this.options.configFile, {
      ignoreInitial: true,
    });
    this.configWatcher
      .on('add', this.reloadConfig.bind(this))
      .on('change', this.reloadConfig.bind(this));

    // Chokidar struggles with relative paths. Make sure the watch pattern is absolute.
    const watchPattern = path.resolve(this.options.appmapDir, '**', 'mtime');

    this.appmapWatcher = chokidar.watch(watchPattern, {
      ignoreInitial: true,
      ignored: ['**/node_modules/**', '**/.git/**'],
    });

    this.appmapPoller = chokidar.watch(watchPattern, {
      ignoreInitial: false,
      ignored: ['**/node_modules/**', '**/.git/**'],
      usePolling: true,
      interval: 1000,
      persistent: false,
    });

    for (const ch of [this.appmapWatcher, this.appmapPoller]) {
      ch.on('add', (mtimePath) => this.scan(mtimePath));
      ch.on('change', (mtimePath) => this.scan(mtimePath));
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

  protected async scan(mtimePath: string): Promise<void> {
    assert(this.config, `config should always be loaded before appmapWatcher triggers a scan`);
    assert(this.configTime);

    const appmapFile = mtimePath.replace(/\/mtime$/, '.appmap.json');
    const reportFile = mtimePath.replace(/mtime$/, 'appmap-findings.json');

    const [appmapStats, reportStats] = await Promise.all(
      [appmapFile, reportFile].map((f) => stat(f).catch(() => null))
    );

    if (!appmapStats) return;

    if (
      reportStats &&
      reportStats.mtimeMs > appmapStats.mtimeMs &&
      reportStats.mtimeMs > this.configTime
    )
      return; // report is up to date

    const scanner = await buildScanner(true, this.config, [appmapFile]);

    const rawScanResults = await scanner.scan();

    // Always report the raw data
    await writeFile(reportFile, formatReport(rawScanResults));
  }

  protected async reloadConfig(): Promise<void> {
    this.config = await parseConfigFile(this.options.configFile);
    this.configTime = (await stat(this.options.configFile)).mtimeMs;
  }
}

export default async function watchScan(options: WatchScanOptions): Promise<void> {
  return new Watcher(options).watch();
}
