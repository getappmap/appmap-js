import { Metadata } from '@appland/models';
import { FSWatcher, watch } from 'chokidar';
import { removeSync, outputFileSync } from 'fs-extra';
import { join, resolve } from 'path';
import EventAggregator from '../lib/eventAggregator';
import flattenMetadata from '../lib/flattenMetadata';
import { intersectMaps } from '../lib/intersectMaps';
import Telemetry from '../telemetry';
import { verbose } from '../utils';
import { FingerprintEvent } from './fingerprinter';
import FingerprintQueue from './fingerprintQueue';
import Globber from './globber';
import path from 'path';

export default class FingerprintWatchCommand {
  private pidfilePath: string | undefined;
  public fpQueue: FingerprintQueue;
  public watcher?: FSWatcher;
  private poller?: Globber;
  private _numProcessed = 0;
  public unreadableFiles = new Set<string>();
  public symlinkLoopFiles = new Set<string>();

  public get numProcessed() {
    return this._numProcessed;
  }

  private set numProcessed(value) {
    this._numProcessed = value;
  }

  constructor(private directory: string) {
    this.pidfilePath = process.env.APPMAP_WRITE_PIDFILE && join(this.directory, 'index.pid');
    this.fpQueue = new FingerprintQueue();

    new EventAggregator((events) => {
      const indexEvents = events.map(({ args: [event] }) => event) as FingerprintEvent[];
      this.sendTelemetry(indexEvents.map(({ metadata }) => metadata));
      this.numProcessed += events.length;
    }).attach(this.fpQueue.handler, 'index');
  }

  removePidfile() {
    if (this.pidfilePath) {
      console.log(`Removing ${this.pidfilePath}`);
      removeSync(this.pidfilePath);
      this.pidfilePath = undefined;
    }
  }

  async disableFileWatching() {
    if (this.watcher) {
      console.warn('Will disable file watching. File polling will stay enabled.');
      await this.watcher?.close();
      this.watcher = undefined;
      console.warn('File watching disabled.');
    }
  }

  getFilenameFromErrorMessage(errorMessage: string): string {
    // The errorMessage must contain the filename within single quotes
    // and looks like this:
    // Error: UNKNOWN: unknown error, lstat 'c:\Users\Test\Programming\MyProject'
    let quoteStartIndex = errorMessage.indexOf(`'`);
    let quoteEndIndex = errorMessage.indexOf(`'`, quoteStartIndex + 1);
    return errorMessage.substring(quoteStartIndex + 1, quoteEndIndex);
  }

  isError(error: unknown, code: string): boolean {
    const err = error as NodeJS.ErrnoException;
    return err.code === code;
  }

  dontProcessFileAgain(error: Error, telemetryName: string, files: Set<string>) {
    console.warn(error.stack);
    Telemetry.sendEvent({
      name: telemetryName,
      properties: {
        errorMessage: error.message,
        errorStack: error.stack,
      },
    });
    const filename = this.getFilenameFromErrorMessage(error.message);
    files.add(filename);
    console.warn('Will not read this file again.');
  }

  async watcherErrorFunction(error: Error) {
    if (this.isError(error, 'ENOSPC')) {
      console.warn(error.stack);
      await this.disableFileWatching();
      Telemetry.sendEvent({
        name: `index:watcher_error:enospc`,
        properties: {
          errorMessage: error.message,
          errorStack: error.stack,
        },
      });
    } else if (this.isError(error, 'EMFILE')) {
      // Don't crash if too many files are open. When the files close
      // the indexer will pick them up.
      console.warn(error.stack);
      await this.disableFileWatching();
      Telemetry.sendEvent({
        name: `index:watcher_error:emfile`,
        properties: {
          errorMessage: error.message,
          errorStack: error.stack,
        },
      });
    } else if (this.isError(error, 'UNKNOWN') && error.message.includes('lstat')) {
      this.dontProcessFileAgain(error, `index:watcher_error:unknown`, this.unreadableFiles);
    } else if (this.isError(error, 'ELOOP')) {
      this.dontProcessFileAgain(error, `index:watcher_error:eloop`, this.symlinkLoopFiles);
    } else {
      // let it crash if it's some other error, to learn what the error is
      throw error;
    }
  }

  // Custom ignore function needed to skip unreadableFiles because
  // attempting to read them can block reading all files. It also
  // cuts down the watch tree to just what we need.
  ignored(targetPath: string) {
    ['/node_modules/', '/.git/'].forEach((pattern) => {
      if (targetPath.includes(pattern)) {
        return true;
      }
    });

    if (this.unreadableFiles.has(targetPath) || this.symlinkLoopFiles.has(targetPath)) {
      return true;
    }

    // Also make sure to not try to recurse down node_modules or .git
    const basename = path.basename(targetPath);
    return basename === 'node_modules' || basename === '.git';
  }

  async execute() {
    this.fpQueue.process().then(() => {
      this.fpQueue.handler.checkVersion = false;
    });

    const glob = `${this.directory}/**/*.appmap.json`;

    this.poller = new Globber(glob)
      .on('add', this.added.bind(this))
      .on('change', this.changed.bind(this))
      .on('unlink', this.removed.bind(this));

    const pollReady = new Promise<void>((r) => this.poller?.once('end', r));
    this.poller.start();
    await pollReady;

    this.watcher = watch(glob, {
      ignoreInitial: true,
      ignored: this.ignored.bind(this),
      ignorePermissionErrors: true,
    })
      .on('add', this.added.bind(this))
      .on('change', this.changed.bind(this))
      .on('unlink', this.removed.bind(this))
      .on('error', this.watcherErrorFunction.bind(this));

    const watchReady = new Promise<void>((r) => this.watcher?.once('ready', r));

    await Promise.all([pollReady, watchReady]);

    this.ready();
  }

  async close() {
    await Promise.all([this.watcher, this.poller].map((ch) => ch?.close()));
    this.removePidfile();
    this.watcher = undefined;
    this.poller = undefined;
  }

  added(file: string) {
    if (verbose()) {
      console.warn(`AppMap added: ${file}`);
    }
    this.enqueue(file);
  }

  changed(file: string) {
    if (verbose()) {
      console.warn(`AppMap changed: ${file}`);
    }
    this.enqueue(file);
  }

  removed(file: string) {
    console.warn(`TODO: AppMap removed: ${file}`);
  }

  ready() {
    if (this.pidfilePath) {
      outputFileSync(this.pidfilePath, `${process.pid}`);
      process.on('exit', this.removePidfile.bind(this));
    }
    if (verbose()) {
      console.warn(`Watching appmaps in ${resolve(process.cwd(), this.directory)}`);
    }
  }

  enqueue(file: string) {
    // This shouldn't be necessary, but it's passing through the wrong file names.
    if (!file.includes('.appmap.json')) {
      return;
    }
    this.fpQueue.push(file);
  }

  private sendTelemetry(metadata: Metadata[]) {
    const properties = Object.fromEntries(
      intersectMaps(...metadata.map(flattenMetadata)).entries()
    );
    Telemetry.sendEvent({
      name: 'appmap:index',
      properties,
      metrics: {
        appmaps: metadata.length,
      },
    });
  }
}
