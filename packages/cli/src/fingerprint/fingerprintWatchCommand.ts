import { Metadata } from '@appland/models';
import { FSWatcher } from 'chokidar';
import { outputFileSync, removeSync } from 'fs-extra';
import path, { join, resolve } from 'path';
import EventAggregator from '../lib/eventAggregator';
import flattenMetadata from '../lib/flattenMetadata';
import { intersectMaps } from '../lib/intersectMaps';
import Telemetry, { Git, GitState } from '../telemetry';
import { verbose } from '../utils';
import { FingerprintEvent } from './fingerprinter';
import FingerprintQueue from './fingerprintQueue';
import Globber from './globber';

export default class FingerprintWatchCommand {
  private pidfilePath: string | undefined;
  public fpQueue: FingerprintQueue;
  public watcher?: FSWatcher;
  private poller?: Globber;
  private _numProcessed = 0;
  private pendingTelemetry?: Promise<void>;
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
      this.pendingTelemetry = this.sendTelemetry(
        indexEvents.map(({ metadata }) => metadata),
        directory
      );
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

  dontProcessFileAgain(error: Error, filename: string, telemetryName: string, files: Set<string>) {
    console.warn(error.stack);
    Telemetry.sendEvent({
      name: telemetryName,
      properties: {
        errorMessage: error.message,
        errorStack: error.stack,
      },
    });
    files.add(filename);
    console.warn('Will not read the file ' + filename + ' again.');
  }

  getToplevelSymbolicLink(filename: string): string {
    // given a filename like '/tmp/topdir/dir1/point_up/dir1/point_up/dir1/point_up'
    // lastToken is set to 'point_up' (the actual symlink)
    // directoryPostfix is set to '/dir1/point_up'
    // topLevelSymbolicLink is set to '/tmp/topdir/dir1/point_up'
    const splitTokens = filename.split(path.sep);
    const lastToken = splitTokens[splitTokens.length - 1];
    const lastIndex = filename.lastIndexOf(lastToken);
    const secondToLastIndex = filename.lastIndexOf(lastToken, lastIndex - 1);
    const directoryPostfixLength = lastIndex - secondToLastIndex;
    const directoryPostfix = filename.substring(
      filename.length - directoryPostfixLength,
      filename.length
    );
    const splitDirectoryPostfix = filename.split(directoryPostfix);
    const toplevelSymbolicLink = splitDirectoryPostfix[0] + directoryPostfix;

    return toplevelSymbolicLink;
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
      const filename = this.getFilenameFromErrorMessage(error.message);
      this.dontProcessFileAgain(
        error,
        filename,
        `index:watcher_error:unknown`,
        this.unreadableFiles
      );
    } else if (this.isError(error, 'ELOOP')) {
      const filename = this.getFilenameFromErrorMessage(error.message);
      const filenameTopLevelSymbolicLink = this.getToplevelSymbolicLink(filename);
      this.dontProcessFileAgain(
        error,
        filenameTopLevelSymbolicLink,
        `index:watcher_error:eloop`,
        this.symlinkLoopFiles
      );
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

  async execute(statDelayMs?: number) {
    this.fpQueue.process().then(() => {
      this.fpQueue.handler.checkVersion = false;
    });

    const glob = `${this.directory}/**/*.appmap.json`;

    this.watcher = new FSWatcher({
      ignoreInitial: false,
      ignored: this.ignored.bind(this),
      ignorePermissionErrors: true,
    })
      .on('add', this.added.bind(this))
      .on('change', this.changed.bind(this))
      .on('unlink', this.removed.bind(this))
      .on('error', this.watcherErrorFunction.bind(this));
    const watchReady = new Promise<void>((r) => this.watcher?.once('ready', r));
    this.watcher.add(glob);
    await watchReady;

    this.poller = new Globber(glob, { statDelayMs })
      .on('add', this.added.bind(this))
      .on('change', this.changed.bind(this))
      .on('unlink', this.removed.bind(this));
    const pollReady = new Promise<void>((r) => this.poller?.once('end', r));
    this.poller.start();
    await pollReady;

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

  private async sendTelemetry(metadata: Metadata[], appmapDir: string) {
    const properties = Object.fromEntries(
      intersectMaps(...metadata.map(flattenMetadata)).entries()
    );
    Telemetry.sendEvent({
      name: 'appmap:index',
      properties: { ...properties, git_state: GitState[await Git.state(appmapDir)] },
      metrics: {
        appmaps: metadata.length,
        contributors: (await Git.contributors(60, appmapDir)).length,
      },
    });
  }

  async telemetrySent(): Promise<void> {
    if (this.pendingTelemetry) {
      await this.pendingTelemetry;
      this.pendingTelemetry = undefined;
    }
  }
}
