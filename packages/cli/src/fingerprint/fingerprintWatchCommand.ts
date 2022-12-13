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

export default class FingerprintWatchCommand {
  private pidfilePath: string | undefined;
  public fpQueue: FingerprintQueue;
  public watcher?: FSWatcher;
  private poller?: Globber;
  private _numProcessed = 0;

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

  async watcherErrorFunction (error: Error) {
    if (this.watcher && error.message.includes("ENOSPC: System limit for number of file watchers reached")) {
      console.warn(error.stack);
      console.warn("Will disable file watching. File polling will stay enabled.");
      await this.watcher?.close();
      this.watcher = undefined;
      console.warn("File watching disabled.");
      Telemetry.sendEvent({
          name: `index:watcher_error:enospc`,
          properties: {
            errorMessage: error.message,
            errorStack: error.stack,
          },
        });
    } else if (error.message.includes("UNKNOWN: unknown error, lstat")) {
      console.warn(error.stack);
      Telemetry.sendEvent({
          name: `index:watcher_error:unknown`,
          properties: {
            errorMessage: error.message,
            errorStack: error.stack,
          },
        });
    } else {
      // let it crash if it's some other error, to learn what the error is
      throw error;
    }
  };

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
      ignored: ['**/node_modules/**', '**/.git/**'],
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
