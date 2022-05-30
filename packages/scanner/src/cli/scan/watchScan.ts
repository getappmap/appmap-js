import { writeFile } from 'fs/promises';
import * as chokidar from 'chokidar';

import Configuration from '../../configuration/types/configuration';

import { formatReport } from './formatReport';
import { default as buildScanner } from './scanner';
import { exists } from 'fs';
import { promisify } from 'util';

type WatchScanOptions = {
  appmapDir: string;
  configData: Configuration;
};

export class Watcher {
  watcher?: chokidar.FSWatcher;

  constructor(private options: WatchScanOptions) {}

  async watch(): Promise<void> {
    this.watcher = chokidar.watch(`${this.options.appmapDir}/**/mtime`, {
      ignoreInitial: true,
    });
    this.watcher.on('add', this.scan.bind(this)).on('change', this.scan.bind(this));
  }

  abort(): void {
    if (!this.watcher) return;

    this.watcher.close();
    this.watcher = undefined;
  }

  async scan(fileName: string): Promise<void> {
    const pathTokens = fileName.split('/');
    const appmapDir = pathTokens.slice(0, pathTokens.length - 1).join('/');
    const appmapFile = [appmapDir, 'appmap.json'].join('.');
    const reportFile = [appmapDir, 'appmap-findings.json'].join('/');

    if (!(await promisify(exists)(appmapFile))) return;

    const scanner = await buildScanner(true, this.options.configData, [appmapFile]);

    const rawScanResults = await scanner.scan();

    // Always report the raw data
    await writeFile(reportFile, formatReport(rawScanResults));
  }
}

export default async function watchScan(options: WatchScanOptions): Promise<void> {
  return new Watcher(options).watch();
}
